"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_1 = require("./services/worker");
exports.default = {
    /**
     * An asynchronous register function that runs before
     * your application is initialized.
     *
     * This gives you an opportunity to extend code.
     */
    register( /* { strapi }: { strapi: Core.Strapi } */) { },
    /**
     * An asynchronous bootstrap function that runs before
     * your application gets started.
     *
     * This gives you an opportunity to set up your data model,
     * run jobs, or perform some special logic.
     */
    async bootstrap({ strapi }) {
        await (0, worker_1.stopVideoWorker)();
        (0, worker_1.startVideoWorker)(strapi);
    },
    async destroy({ strapi }) {
        await (0, worker_1.stopVideoWorker)();
    }
};
