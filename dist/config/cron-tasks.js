"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const ffmpeg_1 = require("../src/services/ffmpeg");
const youtube_1 = require("../src/api/youtube/services/youtube");
const instagram_1 = require("../src/api/instagram/services/instagram");
exports.default = {
    publishPosts: {
        task: async ({ strapi }) => {
            const now = new Date().toISOString();
            const posts = await strapi.documents("api::post.post").findMany({
                filters: {
                    publish_status: "scheduled",
                    publishing: {
                        $lte: now,
                    },
                },
                populate: {
                    video: {
                        populate: '*'
                    },
                    video_orig: {
                        populate: '*'
                    },
                    account: {
                        populate: '*'
                    },
                },
            });
            console.log(now, posts, "[scheduled]");
            for (const post of posts) {
                try {
                    // твоя логика публикации
                    await publish(strapi, post);
                    console.log(post, '[published]');
                    await fs_1.default.unlink((0, ffmpeg_1.getPublicPath)(post.video.url), () => { });
                }
                catch (err) {
                    console.error(post, '[error]');
                    console.error(err);
                }
            }
        },
        options: {
            rule: "*/5 * * * *", // каждые 5 минут
            // rule: "* * * * *",
        },
    },
};
async function publish(strapi, post) {
    switch (post.account.platform) {
        case "youtube":
            await (0, youtube_1.publishToYoutube)(strapi, post);
            break;
        case "instagram":
            await (0, instagram_1.publishToInstagram)(strapi, post);
            break;
    }
}
