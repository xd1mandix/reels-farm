"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
exports.videoQueue = new bullmq_1.Queue("video-render", {
    connection: redis_1.redis,
});
