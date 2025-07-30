import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DeleteResult {
    count: number;
}

async function cleanup() {
    try {
        console.log('🧹 Iniciando limpeza do banco de dados...');
        const timestamp = new Date().toISOString();

        // Verificar registros antes da limpeza
        const totalSpreadsBefore = await prisma.spreadHistory.count();
        const totalPricesBefore = await prisma.$queryRaw<DeleteResult[]>`
            SELECT COUNT(*) as count FROM "PriceHistory"
        `;

        console.log(`[${timestamp}] Registros antes da limpeza:`);
        console.log(`SpreadHistory: ${totalSpreadsBefore}`);
        console.log(`PriceHistory: ${totalPricesBefore[0].count}`);

        // Calcular data limite (24 horas atrás)
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        console.log(`[${timestamp}] Removendo registros anteriores a: ${cutoffDate.toISOString()}`);

        // Verificar quantos registros serão removidos
        const spreadsToDelete = await prisma.spreadHistory.count({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            }
        });

        const pricesToDelete = await prisma.$queryRaw<DeleteResult[]>`
            SELECT COUNT(*) as count FROM "PriceHistory"
            WHERE timestamp < ${cutoffDate}
        `;

        console.log(`[${timestamp}] Registros a serem removidos:`);
        console.log(`SpreadHistory: ${spreadsToDelete}`);
        console.log(`PriceHistory: ${pricesToDelete[0].count}`);

        // Deletar registros antigos do SpreadHistory (mais de 24 horas)
        console.log(`[${timestamp}] Removendo registros antigos de SpreadHistory...`);
        const deletedSpreads = await prisma.spreadHistory.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            }
        });
        console.log(`✅ [${timestamp}] Deletados ${deletedSpreads.count} registros antigos de SpreadHistory`);

        // Deletar registros antigos do PriceHistory (mais de 24 horas)
        console.log(`[${timestamp}] Removendo registros antigos de PriceHistory...`);
        const deletedPrices = await prisma.$queryRaw<DeleteResult[]>`
            DELETE FROM "PriceHistory"
            WHERE timestamp < ${cutoffDate}
            RETURNING COUNT(*) as count
        `;
        console.log(`✅ [${timestamp}] Deletados ${deletedPrices[0].count} registros antigos de PriceHistory`);

        // Verificar registros após a limpeza
        const totalSpreadsAfter = await prisma.spreadHistory.count();
        const totalPricesAfter = await prisma.$queryRaw<DeleteResult[]>`
            SELECT COUNT(*) as count FROM "PriceHistory"
        `;

        console.log(`\n📊 [${timestamp}] Resumo da limpeza:`);
        console.log(`SpreadHistory: ${totalSpreadsBefore} → ${totalSpreadsAfter} (removidos: ${deletedSpreads.count})`);
        console.log(`PriceHistory: ${totalPricesBefore[0].count} → ${totalPricesAfter[0].count} (removidos: ${deletedPrices[0].count})`);

        // Verificar registros mais antigos restantes
        const oldestSpread = await prisma.spreadHistory.findFirst({
            orderBy: {
                timestamp: 'asc'
            },
            select: {
                timestamp: true
            }
        });

        const oldestPrice = await prisma.$queryRaw<{timestamp: Date}[]>`
            SELECT timestamp FROM "PriceHistory"
            ORDER BY timestamp ASC
            LIMIT 1
        `;

        console.log(`\n📅 [${timestamp}] Registros mais antigos restantes:`);
        console.log(`SpreadHistory: ${oldestSpread?.timestamp?.toISOString() || 'Nenhum registro'}`);
        console.log(`PriceHistory: ${oldestPrice[0]?.timestamp?.toISOString() || 'Nenhum registro'}`);

        console.log(`\n🎉 [${timestamp}] Limpeza concluída com sucesso!`);
    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
        throw error;
    }
}

// Função para limpeza manual (pode ser chamada diretamente)
async function manualCleanup() {
    try {
        await cleanup();
        console.log('✅ Limpeza manual concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro na limpeza manual:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Agendar limpeza para rodar diariamente às 02:00 (mantém apenas últimas 24h)
cron.schedule('0 2 * * *', async () => {
    try {
        console.log('⏰ Executando limpeza agendada...');
        await cleanup();
        console.log('✅ Limpeza agendada concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao executar limpeza agendada:', error);
    }
});

// Verificar se é uma execução manual ou automática
const isManualExecution = process.argv.includes('--manual');

if (isManualExecution) {
    console.log('🔧 Executando limpeza manual...');
    manualCleanup();
} else {
    // Executar uma limpeza inicial ao iniciar o script
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

// Manter o processo rodando
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