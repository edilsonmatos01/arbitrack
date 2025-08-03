const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function cleanupOldData() {
  try {
    console.log('🧹 Iniciando limpeza de dados antigos...');
    
    await prisma.$connect();
    console.log('✅ Conexão estabelecida');  
    const totalBefore = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros antes da limpeza: ${totalBefore}`);
    
    // Deletar registros antigos (mais de 24 horas com preços zerados)
    const oldDate = new Date(Date.now() - 2460 * 60 * 1000);
    const deletedRecords = await prisma.spreadHistory.deleteMany({
      where: {
        timestamp: {
          lt: oldDate
        },
        OR: [
          { spotPrice: 0 },
          { futuresPrice: 0 }
        ]
      }
    });
    
    console.log(`✅ ${deletedRecords.count} registros antigos removidos`);
    
    const totalAfter = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros após a limpeza: ${totalAfter}`);
    console.log(`📉 Redução: ${totalBefore - totalAfter} registros`);
    
    // Executar VACUUM
    console.log('🔧 Executando VACUUM...');
    await prisma.$executeRaw`VACUUM ANALYZE;`;
    console.log('✅ VACUUM concluído');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldData(); 