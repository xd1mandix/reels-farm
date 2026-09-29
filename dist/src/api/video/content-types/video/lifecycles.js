"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = require("../../../../services/queue");
exports.default = {
    async afterCreate(event) {
        const { result } = event;
        await queue_1.videoQueue.add("render", {
            documentId: event.result.documentId,
        });
    },
};
