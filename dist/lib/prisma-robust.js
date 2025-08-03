"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.robustPrisma = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: ['error', 'warn'],
});
const poolConfig = {
    pool: {
        min: 1,
        max: 5,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
    },
};
async function checkConnection() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.warn('[Prisma] Conexão perdida, tentando reconectar...');
        return false;
    }
}
async function executeWithRetry(operation, maxRetries = 3) {
    var _a, _b;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const isConnected = await checkConnection();
            if (!isConnected) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            return await operation();
        }
        catch (error) {
            const isLastAttempt = attempt === maxRetries;
            const isConnectionError = error.code === 'P1017' ||
                ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Server has closed')) ||
                ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('connection'));
            if (isConnectionError && !isLastAttempt) {
                console.warn(`[Prisma] Tentativa ${attempt}/${maxRetries} falhou - Reconectando...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                continue;
            }
            throw error;
        }
    }
    throw new Error(`Falha após ${maxRetries} tentativas`);
}
exports.robustPrisma = {
    spreadHistory: {
        create: (data) => executeWithRetry(() => prisma.spreadHistory.create(data)),
        findMany: (params) => executeWithRetry(() => prisma.spreadHistory.findMany(params)),
        count: (params) => executeWithRetry(() => prisma.spreadHistory.count(params)),
        deleteMany: (params) => executeWithRetry(() => prisma.spreadHistory.deleteMany(params)),
    },
    $queryRaw: (query) => executeWithRetry(() => prisma.$queryRaw(query)),
    $executeRaw: (query) => executeWithRetry(() => prisma.$executeRaw(query)),
    $disconnect: () => prisma.$disconnect(),
};
exports.default = prisma;
//# sourceMappingURL=prisma-robust.js.map