import { videoQueue } from "../../../../services/queue";

export default {
    async afterCreate(event) {
      const { result } = event;
  
      console.log("Создана запись:", result);
      await videoQueue.add("render", {
        documentId: event.result.documentId,
      });
    },
  };