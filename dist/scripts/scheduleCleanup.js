"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function cleanup() {
    var _a, _b, _c;
    try {
        console.log('🧹 Iniciando limpeza do banco de dados...');
        const timestamp = new Date().toISOString();
        const totalSpreadsBefore = await prisma.spreadHistory.count();
        const totalPricesBefore = await prisma.$queryRaw `
            SELECT COUNT(*) as count FROM "PriceHistory"
        `;
        console.log(`[${timestamp}] Registros antes da limpeza:`);
        console.log(`SpreadHistory: ${totalSpreadsBefore}`);
        console.log(`PriceHistory: ${totalPricesBefore[0].count}`);
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        console.log(`[${timestamp}] Removendo registros anteriores a: ${cutoffDate.toISOString()}`);
        const spreadsToDelete = await prisma.spreadHistory.count({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            }
        });
        const pricesToDelete = await prisma.$queryRaw `
            SELECT COUNT(*) as count FROM "PriceHistory"
            WHERE timestamp < ${cutoffDate}
        `;
        console.log(`[${timestamp}] Registros a serem removidos:`);
        console.log(`SpreadHistory: ${spreadsToDelete}`);
        console.log(`PriceHistory: ${pricesToDelete[0].count}`);
        console.log(`[${timestamp}] Removendo registros antigos de SpreadHistory...`);
        const deletedSpreads = await prisma.spreadHistory.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            }
        });
        console.log(`✅ [${timestamp}] Deletados ${deletedSpreads.count} registros antigos de SpreadHistory`);
        console.log(`[${timestamp}] Removendo registros antigos de PriceHistory...`);
        const deletedPrices = await prisma.$queryRaw `
            DELETE FROM "PriceHistory"
            WHERE timestamp < ${cutoffDate}
            RETURNING COUNT(*) as count
        `;
        console.log(`✅ [${timestamp}] Deletados ${deletedPrices[0].count} registros antigos de PriceHistory`);
        const totalSpreadsAfter = await prisma.spreadHistory.count();
        const totalPricesAfter = await prisma.$queryRaw `
            SELECT COUNT(*) as count FROM "PriceHistory"
        `;
        console.log(`\n📊 [${timestamp}] Resumo da limpeza:`);
        console.log(`SpreadHistory: ${totalSpreadsBefore} → ${totalSpreadsAfter} (removidos: ${deletedSpreads.count})`);
        console.log(`PriceHistory: ${totalPricesBefore[0].count} → ${totalPricesAfter[0].count} (removidos: ${deletedPrices[0].count})`);
        const oldestSpread = await prisma.spreadHistory.findFirst({
            orderBy: {
                timestamp: 'asc'
            },
            select: {
                timestamp: true
            }
        });
        const oldestPrice = await prisma.$queryRaw `
            SELECT timestamp FROM "PriceHistory"
            ORDER BY timestamp ASC
            LIMIT 1
        `;
        console.log(`\n📅 [${timestamp}] Registros mais antigos restantes:`);
        console.log(`SpreadHistory: ${((_a = oldestSpread === null || oldestSpread === void 0 ? void 0 : oldestSpread.timestamp) === null || _a === void 0 ? void 0 : _a.toISOString()) || 'Nenhum registro'}`);
        console.log(`PriceHistory: ${((_c = (_b = oldestPrice[0]) === null || _b === void 0 ? void 0 : _b.timestamp) === null || _c === void 0 ? void 0 : _c.toISOString()) || 'Nenhum registro'}`);
        console.log(`\n🎉 [${timestamp}] Limpeza concluída com sucesso!`);
    }
    catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
        throw error;
    }
}
async function manualCleanup() {
    try {
        await cleanup();
        console.log('✅ Limpeza manual concluída com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro na limpeza manual:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
node_cron_1.default.schedule('0 2 * * *', async () => {
    try {
        console.log('⏰ Executando limpeza agendada...');
        await cleanup();
        console.log('✅ Limpeza agendada concluída com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao executar limpeza agendada:', error);
    }
});
const isManualExecution = process.argv.includes('--manual');
if (isManualExecution) {
    console.log('🔧 Executando limpeza manual...');
    manualCleanup();
}
else {
    console.log('🚀 Executando limpeza inicial...');
    cleanup()
        .then(() => {
        console.log('✅ Limpeza inicial concluída com sucesso!');
    })
        .catch(error => {
        console.error('❌ Erro na limpeza inicial:', error);
    });
    console.log('⏰ Script de limpeza agendada iniciado. Rodará diariamente às 02:00 (mantém apenas últimas 24h).');
    console.log('💡 Para executar limpeza manual: npm run clean:db:scheduled -- --manual');
}
process.on('SIGINT', async () => {
    console.log('🛑 Encerrando script de limpeza...');
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('🛑 Encerrando script de limpeza (SIGTERM)...');
    await prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=scheduleCleanup.js.map