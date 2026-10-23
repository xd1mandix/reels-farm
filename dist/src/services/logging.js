"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLog = addLog;
exports.clearErrors = clearErrors;
exports.addError = addError;
exports.addProgress = addProgress;
exports.setQueue = setQueue;
exports.addQueue = addQueue;
const UID = 'api::log.log';
const MAX_LOGS = 50;
const getLogsDocument = async (strapi) => {
    let doc = await strapi.documents('api::log.log').findFirst({
        populate: {
            progress: {
                populate: '*'
            }
        }
    });
    if (doc)
        return doc;
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
    return doc;
};
const getProgress = (progress) => {
    const value = (progress !== null && progress !== void 0 ? progress : {});
    const queue = Math.max(0, Number(value.queue) || 0);
    const processed = Math.min(queue, Math.max(0, Number(value.processed) || 0));
    return { processed, queue };
};
/**
 * Добавляет строку в лог.
 * Хранит максимум 50 последних записей.
 */
async function addLog(strapi, log) {
    const doc = await getLogsDocument(strapi);
    const logs = Array.isArray(doc.logs) ? [...doc.logs] : [];
    const entry = typeof log === 'string'
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
async function clearErrors(strapi) {
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
async function addError(strapi, err) {
    const doc = await getLogsDocument(strapi);
    const errors = Array.isArray(doc.errors) ? [...doc.errors] : [];
    let entry;
    if (err instanceof Error) {
        entry = {
            name: err.name,
            message: err.message,
            ...(err.stack ? { stack: err.stack } : {}),
            timestamp: new Date().toISOString(),
        };
    }
    else if (typeof err === 'string') {
        entry = {
            name: 'Error',
            message: err,
            timestamp: new Date().toISOString(),
        };
    }
    else {
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
async function addProgress(strapi) {
    const doc = await getLogsDocument(strapi);
    const progress = getProgress(doc.progress);
    if (progress.processed >= progress.queue)
        return;
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
async function setQueue(strapi, count) {
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
async function addQueue(strapi, count) {
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
