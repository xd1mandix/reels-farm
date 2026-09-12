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
          } catch (err) {
            strapi.log.error(`Failed to publish ${post.documentId}`);
            strapi.log.error(err);
          }
        }
      },
  
      options: {
        rule: "* * * * *", // каждую минуту
      },
    },
  };
  
  async function publishToTelegram(post: any) {
    // Telethon / Telegram API
  }