"use strict";
/**
 * video service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
// import { redis } from '../../../services/redis';
// import { startVideoWorker } from '../../../services/worker';
// import { videoQueue } from '../../../services/queue';
exports.default = {
    ...strapi_1.factories.createCoreService('api::video.video'),
    // redis,
    // worker: startVideoWorker,
    // queue: videoQueue,
};
