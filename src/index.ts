import type { Core } from '@strapi/strapi';
import { startVideoWorker, stopVideoWorker } from "./services/worker";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    if (process.env.ENABLE_VIDEO_WORKER === 'true') {
      await stopVideoWorker()
      startVideoWorker(strapi);
    }
  },

  async destroy({ strapi }: { strapi: Core.Strapi }) {
    await stopVideoWorker()
  }
};