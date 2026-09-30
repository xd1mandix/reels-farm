"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopVideoWorker = exports.startVideoWorker = void 0;
exports.getStrapi = getStrapi;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
const ffmpeg_1 = require("./ffmpeg");
const strapi_1 = require("@strapi/strapi");
let worker = null;
let app = null;
const startVideoWorker = async (strapi) => {
    if (worker)
        return worker;
    app = strapi;
    console.log('start app', app);
    // await getStrapi()
    worker = new bullmq_1.Worker("video-render", async (job) => {
        await (0, ffmpeg_1.processVideo)(job.data.documentId);
    }, {
        connection: redis_1.redis,
        concurrency: 1,
    });
    worker.on("active", job => {
        console.log(`Job ${job.id} started`);
    });
    worker.on("completed", job => {
        console.log(`Job ${job.id} completed`);
    });
    worker.on("failed", (job, err) => {
        console.error(err);
    });
    return worker;
};
exports.startVideoWorker = startVideoWorker;
const stopVideoWorker = async () => {
    console.log('destroy', worker);
    if (!worker)
        return;
    await worker.close();
    worker = null;
};
exports.stopVideoWorker = stopVideoWorker;
async function getStrapi() {
    if (app)
        return app;
    const appContext = await (0, strapi_1.compileStrapi)();
    app = await (0, strapi_1.createStrapi)(appContext);
    await app.load();
    return app;
}
