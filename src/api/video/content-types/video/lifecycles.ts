import { videoQueue } from "../../../../services/queue";

export default {
  async afterCreate(event) {
    const { result } = event;

    await videoQueue.add("render", {
      documentId: event.result.documentId,
    });
  },
};