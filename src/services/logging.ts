
import type { Core } from '@strapi/strapi';

const UID = 'api::log.log' as const;
const MAX_LOGS = 50;

let isLogging = false

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

export function setLogging(state: boolean) {
    isLogging = state
}

// Текущий статус в памяти процесса Strapi.
// addLog изменяет его, а pingLogs сохраняет в БД.
let currentStatus: LogValue | null = null;

const getLogsDocument = async (strapi: Core.Strapi) => {
    let doc = await strapi.documents(UID).findFirst({
        populate: {
            progress: {
                populate: '*',
            },
        },
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

    return doc;
};

/**
 * Извлекает статус из строки лога,
 * удаляя дату и счетчик пингов.
 */
const extractStatus = (log: string): string => {
    return log
        .replace(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]\s*/, '')
        .replace(/\s+x\d+$/, '');
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
 * Обновляет текущий статус в памяти.
 * В базу данных ничего не записывает.
 */
export async function addLog(
    _strapi: Core.Strapi,
    log: LogValue,
): Promise<void> {
    currentStatus = log;
}

/**
 * Сохраняет текущий статус в Single Type.
 *
 * Если статус совпадает с последней записью, увеличивает pings.
 * Если отличается — создаёт новую запись.
 */
export async function pingLogs(
    strapi: Core.Strapi,
): Promise<void> {
    if (!isLogging) return
    if (currentStatus === null) return;

    const doc = await getLogsDocument(strapi);
    const logs: any[] = Array.isArray(doc.logs)
        ? [...doc.logs]
        : [];

    const status =
        typeof currentStatus === 'string'
            ? currentStatus
            : JSON.stringify(currentStatus);

    const lastLog = logs.at(-1);

    if (lastLog && extractStatus(lastLog) === status) {
        const match = lastLog.match(/ x(\d+)$/);
        const pings = match ? Number(match[1]) + 1 : 2;

        logs[logs.length - 1] =
            `${lastLog.replace(/\s+x\d+$/, '')} x${pings}`;
    } else {
        const timestamp = new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19);

        logs.push(`[${timestamp}] ${status}`);
    }

    await strapi.documents(UID).update({
        documentId: doc.documentId,
        data: {
            logs: JSON.parse(
                JSON.stringify(logs.slice(-MAX_LOGS)),
            ),
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

    setLogging(false)

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
    count: number,
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
