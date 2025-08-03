import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

async function vacuumDatabase() {
  try {
    console.log('🧹 Iniciando VACUUM do banco de dados...');
    const startTime = Date.now();

    // Executar VACUUM em todas as tabelas principais
    await prisma.$executeRaw`VACUUM "SpreadHistory"`;
    console.log('✅ VACUUM SpreadHistory concluído');

    await prisma.$executeRaw`VACUUM "PriceHistory"`;
    console.log('✅ VACUUM PriceHistory concluído');

    // OperationHistory não é limpa para manter o histórico de operações
    // await prisma.$executeRaw`VACUUM "OperationHistory"`;
    console.log('ℹ️ OperationHistory preservada (histórico de operações)');

    await prisma.$executeRaw`VACUUM "Position"`;
    console.log('✅ VACUUM Position concluído');

    const duration = Date.now() - startTime;
    console.log(`🎉 VACUUM concluído em ${duration}ms`);

    // Verificar espaço liberado
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;

    console.log('📊 Tamanho das tabelas após VACUUM:', tableSizes);

  } catch (error) {
    console.error('❌ Erro ao executar VACUUM:', error);
  }
}

async function cleanupOldData() {
  try {
    console.log('🗑️ Iniciando limpeza de dados antigos (mantendo apenas últimas 24h)...');
    
    // Remover dados com mais de 24 horas
    const deletedSpreads = await prisma.spreadHistory.deleteMany({
      where: {
        timestamp: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const deletedPrices = await prisma.priceHistory.deleteMany({
      where: {
        timestamp: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // OperationHistory não é limpa para preservar histórico de operações
    console.log(`🗑️ Removidos ${deletedSpreads.count} spreads com mais de 24h`);
    console.log(`🗑️ Removidos ${deletedPrices.count} preços com mais de 24h`);
    console.log('ℹ️ OperationHistory preservada (histórico de operações mantido)');

    // Executar VACUUM após limpeza
    await vacuumDatabase();

  } catch (error) {
    console.error('❌ Erro ao limpar dados antigos:', error);
  }
}

// Configurar cron jobs
function setupCronJobs() {
  console.log('⏰ Configurando jobs de limpeza...');

  // VACUUM diário às 3h da manhã
  cron.schedule('0 3 * * *', async () => {
    console.log('🌅 Executando VACUUM diário...');
    await vacuumDatabase();
  });

  // Limpeza diária às 2h da manhã (mantém apenas últimas 24h)
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Executando limpeza diária (mantendo apenas últimas 24h)...');
    await cleanupOldData();
  });

  // VACUUM a cada 6 horas
  cron.schedule('0 */6 * * *', async () => {
    console.log('🕐 Executando VACUUM a cada 6 horas...');
    await vacuumDatabase();
  });

  console.log('✅ Jobs de limpeza configurados');
}

// Executar imediatamente se chamado diretamente
if (require.main === module) {
  console.log('🚀 Iniciando script de VACUUM...');
  vacuumDatabase()
    .then(() => {
      console.log('✅ Script concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
} else {
  // Exportar para uso em outros módulos
  setupCronJobs();
}

export { vacuumDatabase, cleanupOldData, setupCronJobs }; 