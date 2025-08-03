"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const promises_1 = require("timers/promises");
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: ['error', 'warn'],
});
class CircuitBreaker {
    constructor() {
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = 'CLOSED';
        this.failureThreshold = 5;
        this.recoveryTimeout = 30000;
    }
    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
                this.state = 'HALF_OPEN';
                console.log('[CircuitBreaker] Tentando recuperação...');
            }
            else {
                throw new Error('Circuit breaker is OPEN');
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
            console.log(`[CircuitBreaker] Circuito ABERTO após ${this.failures} falhas`);
        }
    }
}
const circuitBreaker = new CircuitBreaker();
async function recordSpreadRobust(spreadData) {
    var _a, _b, _c;
    const maxRetries = 3;
    const baseDelay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await circuitBreaker.execute(async () => {
                await prisma.spreadHistory.create({
                    data: spreadData
                });
            });
            return;
        }
        catch (error) {
            const isLastAttempt = attempt === maxRetries;
            const isDatabaseError = ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('FATAL')) ||
                ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('starting up')) ||
                ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('not yet accepting'));
            if (isDatabaseError) {
                console.warn(`[Worker] Tentativa ${attempt}/${maxRetries} falhou - Banco instável:`, error.message);
                if (!isLastAttempt) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    console.log(`[Worker] Aguardando ${delay}ms antes da próxima tentativa...`);
                    await (0, promises_1.setTimeout)(delay);
                }
            }
            else {
                console.error(`[Worker] Erro não relacionado ao banco:`, error.message);
                break;
            }
        }
    }
    console.error(`[Worker] Falha ao gravar spread após ${maxRetries} tentativas`);
}
async function checkDatabaseHealth() {
    try {
        await circuitBreaker.execute(async () => {
            await prisma.$queryRaw `SELECT 1`;
        });
        return true;
    }
    catch (error) {
        console.warn('[HealthCheck] Banco não está saudável:', error);
        return false;
    }
}
async function robustWorker() {
    console.log('[Worker] Iniciando worker robusto...');
    while (true) {
        try {
            const isHealthy = await checkDatabaseHealth();
            if (!isHealthy) {
                console.log('[Worker] Banco não está saudável, aguardando 30 segundos...');
                await (0, promises_1.setTimeout)(30000);
                continue;
            }
            await (0, promises_1.setTimeout)(5000);
        }
        catch (error) {
            console.error('[Worker] Erro geral:', error);
            await (0, promises_1.setTimeout)(10000);
        }
    }
}
process.on('SIGINT', async () => {
    console.log('[Worker] Encerrando worker...');
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('[Worker] Encerrando worker...');
    await prisma.$disconnect();
    process.exit(0);
});
robustWorker().catch(console.error);
//# sourceMappingURL=background-worker-robust.js.map