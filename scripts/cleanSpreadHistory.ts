import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOldSpreads() {
    try {
        console.log('🧹 Iniciando limpeza manual da tabela SpreadHistory...');
        
        // Verificar registros antes da limpeza
        const totalBefore = await prisma.spreadHistory.count();
        console.log(`📊 Total de registros antes da limpeza: ${totalBefore}`);

        // Verificar registros antigos (mais de 24 horas)
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

        // Executar a limpeza
        const result = await prisma.spreadHistory.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            }
        });

        console.log(`✅ ${result.count} registros antigos removidos de SpreadHistory.`);

        // Verificar registros após a limpeza
        const totalAfter = await prisma.spreadHistory.count();
        console.log(`📊 Total de registros após a limpeza: ${totalAfter}`);

        // Verificar o registro mais antigo restante
        const oldestRemaining = await prisma.spreadHistory.findFirst({
            orderBy: {
                timestamp: 'asc'
            },
            select: {
                timestamp: true
            }
        });

        console.log(`📅 Registro mais antigo restante: ${oldestRemaining?.timestamp?.toISOString() || 'Nenhum registro'}`);

        console.log('🎉 Limpeza concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro na limpeza:', error);
        throw error;
    }
}

// Executar a limpeza
cleanOldSpreads()
    .catch((e) => {
        console.error('❌ Erro fatal na limpeza:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log('🔌 Conexão com o banco fechada.');
    }); 