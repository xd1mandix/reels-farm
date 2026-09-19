import { google } from "googleapis";
import fs from "fs";
import type { Core } from "@strapi/strapi";
import { createOAuthClient, refreshAccessToken } from "../controllers/youtube";
import { getPublicPath } from '../../../services/ffmpeg';

export async function publishToYoutube(
  strapi: Core.Strapi,
  post: any,
) {
  if (!post || !post?.account) return { error: null }

  const oauth = createOAuthClient()

  const credentials = await refreshAccessToken(post?.account)

  oauth.setCredentials(credentials);

  const youtube = google.youtube({
    version: "v3",
    auth: oauth,
  });

  const filePath = getPublicPath(post.video.url)

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
      body: fs.createReadStream(filePath),
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