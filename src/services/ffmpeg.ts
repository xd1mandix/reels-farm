import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe-static";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { getStrapi } from "./worker";
import { getPublishingDates } from "./schedule";

ffmpeg.setFfprobePath(ffprobe.path);

export async function processVideo(documentId: string) {
  const strapi = await getStrapi()

  const video = await strapi.documents("api::video.video").findOne({
    documentId,
    populate: {
      video: {
        populate: '*'
      },
      posts: {
        populate: '*'
      },
      account: {
        populate: '*'
      },
      partnership: {
        populate: '*'
      },
    },
  });

  const videoPath = getPublicPath(video.video.url)

  let workingVideo = videoPath;

  // If Speed is != 1 - change speed in tmp file
  if (video.speed && video.speed !== 1) {
    const speedPath = getPublicPath(`temp/${documentId}_speed.mp4`)

    await changeSpeed(videoPath, speedPath, video.speed);

    workingVideo = speedPath;
  }

  const duration = await getDuration(workingVideo);

  const partDuration = duration / video.parts;

  let imgPath = null
  if (video.partnership?.content) {
    imgPath = getPublicPath(video.partnership?.content?.url)
  }

  // split video
  for (let i = 0; i < video.parts; i++) {

    const start = i * partDuration;

    const output = getPublicPath(`/temp/${documentId}_${i}.mp4`);

    await renderPart({
      input: videoPath,
      image: imgPath,
      overlay: null, //video.overlayVideo?.url,
      start,
      duration: partDuration,
      output,
    });

    try {
      const media = await uploadToStrapi(output);

      // Plan every part through 4 hours after the last one
      const publishDates = await getPublishingDates(
        strapi,
        video.account.documentId,
        video.parts
      );

      console.log(media)
      await strapi.documents("api::post.post").create({
        data: {
          title: `${video.title} part ${i + 1}`,
          description: `${video.description}\n${video.partnership.post_content}`,
          video_orig: video.documentId,
          publishing: publishDates[i],
          publish_status: 'scheduled',
          video: media,
          account: {
            documentId: video.account.documentId
          }
        },
      });
    } finally {
      // Delete tmp file
      await fs.unlink(output, () => { })
      if (workingVideo !== videoPath) {
        await fs.unlink(workingVideo, () => { })
      }
    }
  }
}

export function getPublicPath(relativePath) {
  return path.join(
    process.cwd(),
    "public",
    relativePath
  );
}

export function getDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    console.log(filePath, 'getDuration')

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      resolve(metadata.format.duration ?? 0);
    });
  });
}

export function changeSpeed(
  input: string,
  output: string,
  speed: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const audioFilters = buildAtempo(speed);

    ffmpeg(input)
      .videoFilters(`setpts=${1 / speed}*PTS`)
      .audioFilters(audioFilters)
      .outputOptions("-movflags", "+faststart")
      .save(output)
      .on("end", () => resolve())
      .on("error", reject);
  });
}

function buildAtempo(speed: number) {
  const filters: string[] = [];

  let value = speed;

  while (value > 2) {
    filters.push("atempo=2");
    value /= 2;
  }

  while (value < 0.5) {
    filters.push("atempo=0.5");
    value *= 2;
  }

  filters.push(`atempo=${value}`);

  return filters.join(",");
}

export function renderPart(options) {
  return new Promise((resolve, reject) => {
    console.log(options, 'opts')

    const command = ffmpeg(options.input)
      .setStartTime(options.start)
      .setDuration(options.duration);

    if (options.image) {
      command.input(options.image);
    }

    if (options.overlay) {
      command.input(options.overlay);
    }

    const filters: string[] = [];

    if (!options.overlay) {
      // ===== Макет №1 =====

      filters.push(
        // Черный холст 1080x1920
        "color=c=black:s=1080x1920:d=1[bg]",

        // Основное видео (80% высоты)
        "[0:v]scale=1080:1536:force_original_aspect_ratio=increase,crop=1080:1536[main]",

        // Верхняя картинка
        "[1:v]scale=w='max(1080,iw)':h=-2[img]",

        // Композиция
        // Сначала кладем видео
        "[bg][main]overlay=0:192[tmp]",

        // Затем картинку поверх него (по центру)
        "[tmp][img]overlay=(W-w)/2:40[out]"
      );
    } else {
      // ===== Макет №2 =====

      filters.push(
        "color=c=black:s=1080x1920:d=1[bg]",

        // Верхнее видео 60%
        "[0:v]scale=1080:1152:force_original_aspect_ratio=increase,crop=1080:1152[top]",
        // Нижнее видео 40%
        "[2:v]scale=1080:768:force_original_aspect_ratio=increase,crop=1080:768[bottom]",
        // Картинка 20% ширины
        "[1:v]scale=216:-2[img]",

        // Сборка
        "[bg][top]overlay=0:0[tmp1]",
        "[tmp1][bottom]overlay=0:1152[tmp2]",

        // Последний слой — изображение
        "[tmp2][img]overlay=20:480[out]"
      );
    }

    command
      .complexFilter(filters, "out")
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-map 0:a?",          // только аудио
        "-pix_fmt yuv420p",
        "-preset medium",
        "-b:v 28M",
        "-maxrate 30M",
        "-bufsize 56M",
        "-b:a 192k",
        "-movflags +faststart",
      ])
      .output(options.output)
      .on("end", resolve)
      .on("stderr", line => console.log(line))
      .on("error", err => console.error(err))
      .on("error", reject)
      .run();
  });
}

export async function uploadToStrapi(path: string) {
  const strapi = await getStrapi()

  const stats = fs.statSync(path);

  console.log(path, stats)

  const [uploaded] = await strapi
    .plugin("upload")
    .service("upload")
    .upload({
      data: {},
      files: {
        filepath: path,                     // ← главное поле
        originalFilename: "clip.mp4",
        mimetype: "video/mp4",
        size: stats.size,
      },
    });

  return uploaded;
}