import fs from 'fs';
import { getPublicPath } from '../src/services/ffmpeg';
export default {
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

        console.log(now, posts)
  
        for (const post of posts) {
          try {
            // твоя логика публикации
            await publishToTelegram(post);
  
            await strapi.documents("api::post.post").update({
              documentId: post.documentId,
              data: {
                publish_status: "published",
              },
            });
  
            strapi.log.info(`Published post ${post.documentId}`);
            // await fs.unlink(getPublicPath(post.video_orig.url), () => {})
          } catch (err) {
            strapi.log.error(`Failed to publish ${post.documentId}`);
            strapi.log.error(err);
          }
        }
      },
  
      options: {
        rule: "*/5 * * * *", // каждую минуту
      },
    },
  };
  
  async function publishToTelegram(post: any) {
    // Telethon / Telegram API
  }