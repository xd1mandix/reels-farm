import fs from 'fs';
import { getPublicPath } from '../src/services/ffmpeg';
import { publishToYoutube } from '../src/api/youtube/services/youtube';
import { publishToInstagram } from '../src/api/instagram/services/instagram';

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

      console.log(now, posts, "[scheduled]")

      for (const post of posts) {
        try {
          // твоя логика публикации
          await publish(strapi, post);

          console.log(post, '[published]');
          await fs.unlink(getPublicPath(post.video.url), () => { })
        } catch (err) {
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

async function publish(strapi: any, post: any) {
  switch (post.account.platform) {
    case "youtube":
      await publishToYoutube(strapi, post)
      break;
    case "instagram":
      await publishToInstagram(strapi, post)
      break;
  }
}