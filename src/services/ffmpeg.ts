import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe-static";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { readdir } from 'node:fs/promises';
import { getStrapi } from "./worker";
import { getPublishingDates } from "./schedule";
import { addError, addLog, addProgress, addQueue, clearErrors, setQueue } from "./logging";

ffmpeg.setFfprobePath(ffprobe.path);

const OVERLAY_DIR = path.resolve(
  process.cwd(),
  'public',
  'uploads',
  'overlay',
);

export async function processVideo(documentId: string) {
  const strapi = await getStrapi()

  await clearErrors(strapi)
  await setQueue(strapi, 0)

  const video = await strapi.documents("api::video.video").findOne({
    documentId,
    populate: {
      video: {
        populate: '*'
      },
      overlay: {
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
      tags: {
        populate: '*'
      },
      start: {
        populate: '*'
      },
      end: {
        populate: '*'
      },
    },
  })


  const videoPath = getPublicPath(video.video.url)

  let workingVideo = videoPath;
  const speed = video.speed || 1;

  await addLog(strapi, `${workingVideo} '[read]'`)
  console.log(workingVideo, '[read]')
  // If Speed is != 1 - change speed in tmp file
  if (speed !== 1) {
    const speedPath = getPublicPath(`temp/${documentId}_speed.mp4`)

    await changeSpeed(videoPath, speedPath, video.speed);

    workingVideo = speedPath;
    await addLog(strapi, `${workingVideo} '[sped up]'`)
    console.log(workingVideo, '[sped up]')
  }

  const fullDuration = await getDuration(workingVideo);

  // 3. timecodes (seconds)
  let startTime = parseTimestamp(video.start);
  let endTime = video.end
    ? parseTimestamp(video.end)
    : fullDuration * speed; // если конец не указан

  // correct after speed up  
  startTime /= speed;
  endTime /= speed;

  endTime = Math.min(fullDuration, endTime);
  startTime = Math.min(endTime, startTime);

  const duration = endTime - startTime;
  const partDuration = duration / video.parts;

  let imgPath = null
  if (video.partnership?.content) {
    imgPath = getPublicPath(video.partnership?.content?.url)
  }

  // Plan every part through 4 hours after the last one
  const publishDates = await getPublishingDates(
    strapi,
    video.account.documentId,
    video.parts
  );

  await addLog(strapi, `${JSON.stringify(publishDates)} '[planned]'`)
  console.log(JSON.stringify(publishDates), '[planned]')
  await addQueue(strapi, video.parts)

  // split video
  for (let i = 0; i < video.parts; i++) {

    await addLog(strapi, `${i.toString()} '[processing]'`)
    const start = startTime + i * partDuration;

    const output = getPublicPath(`/temp/${documentId}_${i}.mp4`);
    const overlay = video.overlay?.url || await getRandomOverlay()

    await renderPart({
      input: workingVideo,
      image: imgPath,
      overlay: overlay,
      start,
      duration: partDuration,
      output,
    });

    await addLog(strapi, `${i.toString()}, ${output} '[rendered]'`)
    console.log(i.toString(), output, "[rendered]")

    try {
      const media = await uploadToStrapi(output, `${documentId}_${i}`);

      await strapi.documents("api::post.post").create({
        data: {
          title: `${video.title} part ${i + 1}`,
          description: `${video.description || ''}\n${video.partnership?.post_content || ''}\n${video.tags.map((i) => `#${i.value}`).join(' ')}`,
          video_orig: video.documentId,
          publishing: publishDates[i],
          publish_status: 'scheduled',
          video: media,
          account: {
            documentId: video.account.documentId
          }
        },
      });

      await addLog(strapi, `${i} '[upladed]'`)
      console.log(i.toString(), JSON.stringify(media), "[upladed]")
      await addProgress(strapi)

    } catch (e) {
      await addError(strapi, e)
    } finally {
      // Delete tmp file
      await fs.unlink(output, () => { })
      await addLog(strapi, `${i}, ${output} '[deleted]'`)
      console.log(output, "[deleted]")
    }
  }

  await fs.unlink(workingVideo, () => { })
  if (workingVideo !== videoPath) {
    await fs.unlink(videoPath, () => { })
  }
}

export function getPublicPath(relativePath) {
  return path.join(
    process.cwd(),
    "public",
    relativePath
  );
}

function parseTimestamp(time?: { MM?: number, SS?: number }): number {
  if (!time) return 0;

  return time.MM * 60 + time.SS;
}

export function getDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      resolve(metadata.format.duration ?? 0);
    });
  })
}

export async function getRandomOverlay(): Promise<string | null> {
  const files = await readdir(OVERLAY_DIR, {
    withFileTypes: true,
  });

  const videos = files
    .filter((file) => file.isFile())
    .map((file) => file.name)

  if (videos.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * videos.length);

  return path.join(OVERLAY_DIR, videos[randomIndex]);
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
      .on("error", async (err) => { await addError(strapi, err); reject(err) });
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

    const command = ffmpeg(options.input)
      .setStartTime(options.start)
      .setDuration(options.duration);

    if (options.image) {
      command.input(options.image);
    }

    if (options.overlay) {
      command.input(options.overlay);
    }

    const filters: string[] = newComposition(options);

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
      .on("error", async (err) => { await addError(strapi, err); reject(err) })
      .run();
  });
}

export async function uploadToStrapi(path: string, name: string) {
  const strapi = await getStrapi()

  const stats = fs.statSync(path);

  const [uploaded] = await strapi
    .plugin("upload")
    .service("upload")
    .upload({
      data: {},
      files: {
        filepath: path,                     // ← главное поле
        originalFilename: `${name}.mp4`,
        mimetype: "video/mp4",
        size: stats.size,
      },
    });

  return uploaded;
}

const newComposition = (options) => {
  const filters: string[] = [];

  const hasImg = !!options.image;
  const hasOverlay = !!options.overlay;

  const overlayIndex = hasImg ? 2 : 1;

  filters.push(
    "color=c=black:s=1080x1920:d=1[bg]",
    hasOverlay
      ? "[0:v]hflip,scale=1080:1152:force_original_aspect_ratio=increase,crop=1080:1152[main]"
      : "[0:v]hflip,scale=1080:1536:force_original_aspect_ratio=increase,crop=1080:1536[main]"
  );

  if (hasOverlay) {
    filters.push(
      `[${overlayIndex}:v]scale=1080:768:force_original_aspect_ratio=increase,crop=1080:768[bottom]`
    );
  }

  if (hasImg) {
    filters.push(
      hasOverlay
        ? "[1:v]scale=216:-2[img]"
        : "[1:v]scale=w='max(1080,iw)':h=-2[img]"
    );
  }

  const firstLabel = hasOverlay || hasImg ? "tmp1" : "out";

  filters.push(
    hasOverlay
      ? `[bg][main]overlay=0:0[${firstLabel}]`
      : `[bg][main]overlay=0:192[${firstLabel}]`
  );

  if (hasOverlay) {
    filters.push(
      hasImg
        ? "[tmp1][bottom]overlay=0:1152[tmp2]"
        : "[tmp1][bottom]overlay=0:1152[out]"
    );
  }

  if (hasImg) {
    filters.push(
      hasOverlay
        ? "[tmp2][img]overlay=20:480[out]"
        : "[tmp1][img]overlay=(W-w)/2:40[out]"
    );
  }

  return filters;
}

const oldComposition = (options, filters) => {
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
}