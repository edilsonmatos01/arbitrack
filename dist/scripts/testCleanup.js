"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testCleanup() {
    try {
        console.log('🧪 Testando funcionalidade de limpeza...');
        const initialCount = await prisma.spreadHistory.count();
        console.log(`📊 Registros iniciais: ${initialCount}`);
        if (initialCount === 0) {
            console.log('⚠️  Tabela SpreadHistory está vazia. Não é possível testar a limpeza.');
            return;
        }
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const oldRecords = await prisma.spreadHistory.count({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            }
        });
        console.log(`📅 Registros antigos (antes de ${cutoffDate.toISOString()}): ${oldRecords}`);
        if (oldRecords === 0) {
            console.log('✅ Nenhum registro antigo encontrado. Tabela já está limpa!');
            return;
        }
        console.log('🔍 Simulando limpeza...');
        const recordsToDelete = await prisma.spreadHistory.findMany({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            },
            select: {
                id: true,
                symbol: true,
                timestamp: true
            },
            take: 5
        });
        console.log('📋 Primeiros registros que seriam removidos:');
        recordsToDelete.forEach((record, index) => {
            const ageInHours = (Date.now() - record.timestamp.getTime()) / (1000 * 60 * 60);
            console.log(`  ${index + 1}. ${record.symbol} - ${record.timestamp.toISOString()} (${ageInHours.toFixed(2)}h atrás)`);
        });
        const shouldExecute = process.argv.includes('--execute');
        if (shouldExecute) {
            console.log('🔧 Executando limpeza real...');
            const result = await prisma.spreadHistory.deleteMany({
                where: {
                    timestamp: {
                        lt: cutoffDate
                    }
                }
            });
            console.log(`✅ ${result.count} registros removidos com sucesso!`);
            const finalCount = await prisma.spreadHistory.count();
            console.log(`📊 Registros finais: ${finalCount}`);
            if (finalCount < initialCount) {
                console.log('🎉 Teste de limpeza PASSOU!');
            }
            else {
                console.log('❌ Teste de limpeza FALHOU!');
            }
        }
        else {
            console.log('💡 Para executar a limpeza real, use: npm run test-cleanup -- --execute');
            console.log('✅ Simulação concluída com sucesso!');
        }
    }
    catch (error) {
        console.error('❌ Erro no teste:', error);
        throw error;
    }
}
testCleanup()
    .catch((e) => {
    console.error('❌ Erro fatal no teste:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexão com o banco fechada.');
});
//# sourceMappingURL=testCleanup.js.map