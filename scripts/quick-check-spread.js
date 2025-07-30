const { PrismaClient } = require('@prisma/client');

async function quickCheck() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificação rápida dos dados de spread...');
    
    await prisma.$connect();
    
    const total = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros: ${total}`);
    
    if (total > 0) {
      const recent = await prisma.spreadHistory.findMany({
        orderBy: { timestamp: 'desc' },
        take: 3,
        select: { symbol: true, spread: true, timestamp: true }
      });
      
      console.log('📈 Últimos 3 registros:');
      recent.forEach((r, i) => {
        console.log(`${i+1}. ${r.symbol}: ${r.spread}% - ${r.timestamp.toISOString()}`);
      });
    } else {
      console.log('❌ Nenhum registro encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck(); 