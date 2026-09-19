import type { Core } from "@strapi/strapi";

const FOUR_HOURS = 4 * 60 * 60 * 1000;

export async function getPublishingDates(
    strapi: Core.Strapi,
    accountDocumentId: string,
    parts: number
): Promise<Date[]> {
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
        },
        sort: ["publishing:desc"],
        fields: ["publishing"],
    });

    const dates: Date[] = [];

    let current = lastPost?.publishing
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