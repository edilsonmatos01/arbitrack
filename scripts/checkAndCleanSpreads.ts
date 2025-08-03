import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndCleanSpreads() {
    try {
        console.log('🔍 Verificando status da tabela SpreadHistory...');
        
        // Contar total de registros
        const totalRecords = await prisma.spreadHistory.count();
        console.log(`📊 Total de registros: ${totalRecords}`);

        if (totalRecords === 0) {
            console.log('✅ Tabela SpreadHistory está vazia.');
            return;
        }

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

        // Verificar registros recentes (últimas 24 horas)
        const recentRecords = await prisma.spreadHistory.count({
            where: {
                timestamp: {
                    gte: cutoffDate
                }
            }
        });

        console.log(`📅 Registros das últimas 24 horas: ${recentRecords}`);

        // Verificar o registro mais antigo
        const oldestRecord = await prisma.spreadHistory.findFirst({
            orderBy: {
                timestamp: 'asc'
            },
            select: {
                timestamp: true,
                symbol: true
            }
        });

        // Verificar o registro mais recente
        const newestRecord = await prisma.spreadHistory.findFirst({
            orderBy: {
                timestamp: 'desc'
            },
            select: {
                timestamp: true,
                symbol: true
            }
        });

        console.log(`📅 Registro mais antigo: ${oldestRecord?.timestamp?.toISOString()} (${oldestRecord?.symbol})`);
        console.log(`📅 Registro mais recente: ${newestRecord?.timestamp?.toISOString()} (${newestRecord?.symbol})`);

        // Calcular idade do registro mais antigo
        if (oldestRecord?.timestamp) {
            const ageInHours = (Date.now() - oldestRecord.timestamp.getTime()) / (1000 * 60 * 60);
            console.log(`⏰ Idade do registro mais antigo: ${ageInHours.toFixed(2)} horas`);
        }

        // Verificar se há registros muito antigos (mais de 48 horas)
        const veryOldRecords = await prisma.spreadHistory.count({
            where: {
                timestamp: {
                    lt: new Date(Date.now() - 48 * 60 * 60 * 1000)
                }
            }
        });

        if (veryOldRecords > 0) {
            console.log(`⚠️  ATENÇÃO: ${veryOldRecords} registros com mais de 48 horas encontrados!`);
            console.log('💡 Recomenda-se executar uma limpeza manual.');
        }

        // Se há registros antigos, perguntar se deve limpar
        if (oldRecords > 0) {
            console.log(`\n🧹 Encontrados ${oldRecords} registros antigos para remoção.`);
            
            // Verificar se foi passado argumento para forçar limpeza
            const forceClean = process.argv.includes('--force');
            
            if (forceClean) {
                console.log('🔧 Executando limpeza forçada...');
                await cleanOldSpreads();
            } else {
                console.log('💡 Para executar limpeza, use: npm run check-spreads -- --force');
            }
        } else {
            console.log('✅ Nenhum registro antigo encontrado. Tabela está limpa!');
        }

    } catch (error) {
        console.error('❌ Erro ao verificar tabela:', error);
        throw error;
    }
}

async function cleanOldSpreads() {
    try {
        console.log('🧹 Iniciando limpeza da tabela SpreadHistory...');
        
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const result = await prisma.spreadHistory.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate
                }
            }
        });

        console.log(`✅ ${result.count} registros antigos removidos de SpreadHistory.`);
        
        // Verificar resultado final
        const remainingRecords = await prisma.spreadHistory.count();
        console.log(`📊 Registros restantes: ${remainingRecords}`);
        
    } catch (error) {
        console.error('❌ Erro na limpeza:', error);
        throw error;
    }
}

// Executar verificação
checkAndCleanSpreads()
    .catch((e) => {
        console.error('❌ Erro fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log('🔌 Conexão com o banco fechada.');
    }); 