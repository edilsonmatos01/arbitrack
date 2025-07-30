"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function cleanOldSpreads() {
    var _a;
    try {
        console.log('🧹 Iniciando limpeza manual da tabela SpreadHistory...');
        const totalBefore = await prisma.spreadHistory.count();
        console.log(`📊 Total de registros antes da limpeza: ${totalBefore}`);
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const oldRecords = await prisma.spreadHistory.count({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            }
        });
        console.log(`📅 Registros anteriores a ${cutoffDate.toISOString()}: ${oldRecords}`);
        if (oldRecords === 0) {
            console.log('✅ Nenhum registro antigo encontrado para remoção.');
            return;
        }
        const result = await prisma.spreadHistory.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            }
        });
        console.log(`✅ ${result.count} registros antigos removidos de SpreadHistory.`);
        const totalAfter = await prisma.spreadHistory.count();
        console.log(`📊 Total de registros após a limpeza: ${totalAfter}`);
        const oldestRemaining = await prisma.spreadHistory.findFirst({
            orderBy: {
                timestamp: 'asc'
            },
            select: {
                timestamp: true
            }
        });
        console.log(`📅 Registro mais antigo restante: ${((_a = oldestRemaining === null || oldestRemaining === void 0 ? void 0 : oldestRemaining.timestamp) === null || _a === void 0 ? void 0 : _a.toISOString()) || 'Nenhum registro'}`);
        console.log('🎉 Limpeza concluída com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro na limpeza:', error);
        throw error;
    }
}
cleanOldSpreads()
    .catch((e) => {
    console.error('❌ Erro fatal na limpeza:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexão com o banco fechada.');
});
//# sourceMappingURL=cleanSpreadHistory.js.map