import { Worker } from "bullmq";
import { redis } from "./redis";
import { processVideo } from "./ffmpeg";
import { compileStrapi, Core, createStrapi } from "@strapi/strapi";

let worker = null
let app = null

export const startVideoWorker = async () => {
  if (worker) return worker;
  await getStrapi()

  worker = new Worker(
    "video-render",
    async job => {
      await processVideo(job.data.documentId);
    },
    {
      connection: redis,
      concurrency: 1,
    }
  );

  worker.on("active", job => {
    console.log(`Job ${job.id} started`);
  });

  worker.on("completed", job => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(err);
  });

  return worker
}; 

export const stopVideoWorker = async () => {
  if (!worker) return;

  await worker.close();
  worker = null;
};

export async function getStrapi(): Promise<Core.Strapi> { 
  if(app) return app

  const appContext = await compileStrapi();
  app = await createStrapi(appContext);
  await app.load();

  return app
}