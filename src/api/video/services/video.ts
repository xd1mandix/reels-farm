/**
 * video service
 */

import { factories } from '@strapi/strapi';
// import { redis } from '../../../services/redis';
// import { startVideoWorker } from '../../../services/worker';
// import { videoQueue } from '../../../services/queue';


export default {
    ...factories.createCoreService('api::video.video'),
    // redis,
    // worker: startVideoWorker,
    // queue: videoQueue,
};
