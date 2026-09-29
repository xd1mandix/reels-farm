"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishToYoutube = publishToYoutube;
const googleapis_1 = require("googleapis");
const fs_1 = __importDefault(require("fs"));
const youtube_1 = require("../controllers/youtube");
const ffmpeg_1 = require("../../../services/ffmpeg");
async function publishToYoutube(strapi, post) {
    if (!post || !(post === null || post === void 0 ? void 0 : post.account))
        return { error: null };
    const oauth = (0, youtube_1.createOAuthClient)();
    const credentials = await (0, youtube_1.refreshAccessToken)(post === null || post === void 0 ? void 0 : post.account);
    oauth.setCredentials(credentials);
    const youtube = googleapis_1.google.youtube({
        version: "v3",
        auth: oauth,
    });
    const filePath = (0, ffmpeg_1.getPublicPath)(post.video.url);
    const response = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: {
                title: post.title,
                description: post.description,
                categoryId: "22",
            },
            status: {
                privacyStatus: "private",
                publishAt: new Date(post.publishing).toISOString(),
                selfDeclaredMadeForKids: false,
            },
        },
        media: {
            body: fs_1.default.createReadStream(filePath),
        },
    });
    await strapi.documents("api::post.post").update({
        documentId: post.documentId,
        data: {
            link: `https://youtu.be/${response.data.id}`,
            publish_status: "published",
        },
    });
    return response.data;
}
