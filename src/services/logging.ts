import type { Core } from '@strapi/strapi';

const UID = 'api::log.log' as const;
const MAX_LOGS = 50;

type LogValue = string | Record<string, unknown>;

type Progress = {
    processed: number;
    queue: number;
};

type ErrorValue = {
    name: string;
    message: string;
    stack?: string;
    timestamp: string;
    details?: unknown;
};

const getLogsDocument = async (strapi: Core.Strapi) => {
    let doc = await strapi.documents('api::log.log').findFirst({
        populate: {
            progress: {
                populate: '*'
            }
        }
    });

    if (doc) return doc;

    doc = await strapi.documents(UID).create({
        data: {
            logs: [],
            errors: [],
            progress: {
                processed: 0,
                queue: 0,
            },
        },
    });

    return doc
};

const getProgress = (progress: unknown): Progress => {
    const value = (progress ?? {}) as Partial<Progress>;

    const queue = Math.max(0, Number(value.queue) || 0);
    const processed = Math.min(
        queue,
        Math.max(0, Number(value.processed) || 0),
    );

    return { processed, queue };
};

/**
 * Добавляет строку в лог.
 * Хранит максимум 50 последних записей.
 */
export async function addLog(
    strapi: Core.Strapi,
    log: LogValue,
): Promise<void> {
    const doc = await getLogsDocument(strapi);

    const logs = Array.isArray(doc.logs) ? [...doc.logs] : [];

    const entry =
        typeof log === 'string'
            ? `[${new Date().toISOString()}] ${log}`
            : {
                timestamp: new Date().toISOString(),
                ...log,
            };

    logs.push(entry);

    await strapi.documents(UID).update({
        documentId: doc.documentId,
        data: {
            logs: logs.slice(-MAX_LOGS),
        },
    });
}

/**
 * Очищает список ошибок.
 */
export async function clearErrors(
    strapi: Core.Strapi,
): Promise<void> {
    const doc = await getLogsDocument(strapi);

    await strapi.documents(UID).update({
        documentId: doc.documentId,
        data: {
            errors: [],
        },
    });
}

/**
 * Добавляет ошибку, сохраняя message, stack и дополнительные данные.
 */
export async function addError(
    strapi: Core.Strapi,
    err: unknown,
): Promise<void> {
    const doc = await getLogsDocument(strapi);

    const errors = Array.isArray(doc.errors) ? [...doc.errors] : [];

    let entry: ErrorValue;

    if (err instanceof Error) {
        entry = {
            name: err.name,
            message: err.message,
            ...(err.stack ? { stack: err.stack } : {}),
            timestamp: new Date().toISOString(),
        };
    } else if (typeof err === 'string') {
        entry = {
            name: 'Error',
            message: err,
            timestamp: new Date().toISOString(),
        };
    } else {
        entry = {
            name: 'Error',
            message: 'An unknown error occurred',
            timestamp: new Date().toISOString(),
            details: err,
        };
    }

    errors.push(JSON.stringify(entry));

    await strapi.documents(UID).update({
        documentId: doc.documentId,
        data: {
            errors,
        },
    });
}

/**
 * Увеличивает processed на 1, но не выше queue.
 */
export async function addProgress(
    strapi: Core.Strapi,
): Promise<void> {
    const doc = await getLogsDocument(strapi);
    const progress = getProgress(doc.progress);

    if (progress.processed >= progress.queue) return;

    await strapi.documents(UID).update({
        documentId: doc.documentId,
        data: {
            progress: {
                ...progress,
                processed: progress.processed + 1,
            },
        },
    });
}

/**
 * Устанавливает количество запланированных видео.
 * Если queue меньше processed, processed уменьшается до queue.
 */
export async function setQueue(
    strapi: Core.Strapi,
    count: number,
): Promise<void> {
    const doc = await getLogsDocument(strapi);
    const progress = getProgress(doc.progress);

    const queue = Math.max(0, Math.floor(Number(count) || 0));

    await strapi.documents(UID).update({
        documentId: doc.documentId,
        data: {
            progress: {
                processed: Math.min(progress.processed, queue),
                queue,
            },
        },
    });
}

/**
 * Увеличивает queue на count.
 */
export async function addQueue(
    strapi: Core.Strapi,
    count: number
): Promise<void> {
    const doc = await getLogsDocument(strapi);
    const progress = getProgress(doc.progress);

    await strapi.documents(UID).update({
        documentId: doc.documentId,
        data: {
            progress: {
                ...progress,
                queue: progress.queue + count,
            },
        },
    });
}