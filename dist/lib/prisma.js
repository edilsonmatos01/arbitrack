"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL + '?sslmode=require&connect_timeout=60&application_name=arbitragem',
        },
    },
    log: ['error', 'warn'],
});
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
    var _a, _b, _c;
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
                ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('connection')) ||
                ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('timeout'));
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
exports.default = prisma;
//# sourceMappingURL=prisma.js.map