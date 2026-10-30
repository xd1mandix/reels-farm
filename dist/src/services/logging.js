"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogging = setLogging;
exports.addLog = addLog;
exports.pingLogs = pingLogs;
exports.clearErrors = clearErrors;
exports.addError = addError;
exports.addProgress = addProgress;
exports.setQueue = setQueue;
exports.addQueue = addQueue;
const UID = 'api::log.log';
const MAX_LOGS = 50;
let isLogging = false;
function setLogging(state) {
    isLogging = state;
}
// Текущий статус в памяти процесса Strapi.
// addLog изменяет его, а pingLogs сохраняет в БД.
let currentStatus = null;
const getLogsDocument = async (strapi) => {
    let doc = await strapi.documents(UID).findFirst({
        populate: {
            progress: {
                populate: '*',
            },
        },
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
/**
 * Извлекает статус из строки лога,
 * удаляя дату и счетчик пингов.
 */
const extractStatus = (log) => {
    return log
        .replace(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]\s*/, '')
        .replace(/\s+x\d+$/, '');
};
const getProgress = (progress) => {
    const value = (progress !== null && progress !== void 0 ? progress : {});
    const queue = Math.max(0, Number(value.queue) || 0);
    const processed = Math.min(queue, Math.max(0, Number(value.processed) || 0));
    return { processed, queue };
};
/**
 * Обновляет текущий статус в памяти.
 * В базу данных ничего не записывает.
 */
async function addLog(_strapi, log) {
    currentStatus = log;
}
/**
 * Сохраняет текущий статус в Single Type.
 *
 * Если статус совпадает с последней записью, увеличивает pings.
 * Если отличается — создаёт новую запись.
 */
async function pingLogs(strapi) {
    if (!isLogging)
        return;
    if (currentStatus === null)
        return;
    const doc = await getLogsDocument(strapi);
    const logs = Array.isArray(doc.logs)
        ? [...doc.logs]
        : [];
    const status = typeof currentStatus === 'string'
        ? currentStatus
        : JSON.stringify(currentStatus);
    const lastLog = logs.at(-1);
    if (lastLog && extractStatus(lastLog) === status) {
        const match = lastLog.match(/ x(\d+)$/);
        const pings = match ? Number(match[1]) + 1 : 2;
        logs[logs.length - 1] =
            `${lastLog.replace(/\s+x\d+$/, '')} x${pings}`;
    }
    else {
        const timestamp = new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19);
        logs.push(`[${timestamp}] ${status}`);
    }
    await strapi.documents(UID).update({
        documentId: doc.documentId,
        data: {
            logs: JSON.parse(JSON.stringify(logs.slice(-MAX_LOGS))),
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
    setLogging(false);
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
