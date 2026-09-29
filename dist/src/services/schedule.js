"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishingDates = getPublishingDates;
const FOUR_HOURS = 4 * 60 * 60 * 1000;
async function getPublishingDates(strapi, accountDocumentId, parts) {
    const lastPost = await strapi.documents("api::post.post").findFirst({
        filters: {
            account: {
                documentId: {
                    $eq: accountDocumentId,
                },
            },
            publishing: {
                $notNull: true,
            },
            publish_status: 'scheduled'
        },
        sort: ["publishing:desc"],
        fields: ["publishing"],
    });
    const dates = [];
    let current = (lastPost === null || lastPost === void 0 ? void 0 : lastPost.publishing)
        ? new Date(lastPost.publishing)
        : new Date();
    if (lastPost) {
        current = new Date(current.getTime() + FOUR_HOURS);
    }
    for (let i = 0; i < parts; i++) {
        dates.push(new Date(current));
        current = new Date(current.getTime() + FOUR_HOURS);
    }
    return dates;
}
