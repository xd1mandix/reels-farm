import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe-static";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { getStrapi } from "./worker";

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
  const duration = await getDuration(videoPath);
 
  const partDuration = duration / video.parts;
  
  const imgPath = getPublicPath(video.partnership.content?.url) 

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

      await strapi.documents("api::post.post").create({
        data: {
          description: `${video.name} part ${i + 1}`,
          video: video.documentId,
          publishing: new Date(),
          account: {
            documentId: video.account.documentId
          }
        },
      });
    } finally {
      // Удаляем временный файл независимо от результата
      await fs.unlink(output, () => {})
    }
  }
}

function getPublicPath(relativePath) {
  return path.join(
    process.cwd(),
    "public",
    relativePath
  );
}

export function getDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(err);
  
        resolve(metadata.format.duration ?? 0);
      });
    });
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
  
      command
        .complexFilter([
          "overlay=20:20"
        ])
        .output(options.output)
        .on("end", resolve)
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