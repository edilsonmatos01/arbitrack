const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
  try {
    console.log('🔍 Verificando dados...\n');
    
    // Contar registros
    const total = await prisma.spreadHistory.count();
    console.log(`Total de registros: ${total}`);
    
    // Últimos 3 registros
    const recent = await prisma.spreadHistory.findMany({
      take: 3,
      orderBy: { timestamp: 'desc' }
    });
    
    console.log('\nÚltimos 3 registros:');
    recent.forEach((r, i) => {
      console.log(`${i+1}. ${r.symbol} - ${r.spread.toFixed(4)}% - ${r.timestamp.toLocaleString()}`);
    });
    
    // Verificar se há dados reais (não TEST)
    const realData = await prisma.spreadHistory.findMany({
      where: {
        NOT: {
          symbol: { contains: 'TEST' }
        }
      },
      take: 5
    });
    
    console.log(`\nDados reais encontrados: ${realData.length}`);
    if (realData.length > 0) {
      console.log('Símbolos reais:', realData.map(r => r.symbol).join(', '));
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro:', error);
  }
}

check(); 