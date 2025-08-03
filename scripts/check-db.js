const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando banco de dados...');
    
    // Conta total de registros
    const totalCount = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros: ${totalCount}`);
    
    // Conta registros das últimas 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.spreadHistory.count({
      where: {
        timestamp: { gte: since }
      }
    });
    console.log(`📈 Registros nas últimas 24h: ${recentCount}`);
    
    // Últimos 5 registros
    const recentRecords = await prisma.spreadHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    if (recentRecords.length > 0) {
      console.log('\n📋 Últimos registros:');
      recentRecords.forEach(record => {
        const time = new Date(record.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        console.log(`  ${record.symbol}: ${record.spread.toFixed(4)}% (${time})`);
      });
    } else {
      console.log('⚠️  Nenhum registro encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 