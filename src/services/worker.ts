import { Worker } from "bullmq";
import { redis } from "./redis";
import { processVideo } from "./ffmpeg";
import { compileStrapi, Core, createStrapi } from "@strapi/strapi";
import { addError, setLogging } from "./logging";

let worker = null
let app = null

export const startVideoWorker = async (strapi) => {
  if (worker) return worker;
  app = strapi
  // await getStrapi()

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
    setLogging(true)
  });

  worker.on("completed", job => {
    console.log(`Job ${job.id} completed`);
    setLogging(false)
  });

  worker.on("failed", async (job, err) => {
    console.error(err);
    await addError(strapi, err);
    setLogging(false)
  });

  return worker
};

export const stopVideoWorker = async () => {
  console.log('destroy', worker)
  if (!worker) return;

  await worker.close();
  worker = null;
};

export async function getStrapi(): Promise<Core.Strapi> {
  if (app) return app

  const appContext = await compileStrapi();
  app = await createStrapi(appContext);
  await app.load();

  return app
}