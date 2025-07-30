const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function investigatePrices() {
  try {
    console.log('🔍 Investigando preços nos registros...');
    
    await prisma.$connect();
    console.log('✅ Conexão estabelecida');
    
    // Contar total de registros
    const total = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros: ${total}`);
    
    // Contar registros com preços preenchidos
    const withPrices = await prisma.spreadHistory.count({
      where: {
        spotPrice: { not: 0 },
        futuresPrice: { not: 0 }
      }
    });
    console.log(`💰 Registros com preços preenchidos: ${withPrices}`);
    
    // Contar registros com preços zerados
    const withZeroPrices = await prisma.spreadHistory.count({
      where: {
        OR: [
          { spotPrice: 0 },
          { futuresPrice: 0 }
        ]
      }
    });
    console.log(`❌ Registros com preços zerados: ${withZeroPrices}`);
    
    // Verificar registros por período (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTotal = await prisma.spreadHistory.count({
      where: {
        timestamp: { gte: oneDayAgo }
      }
    });
    
    const recentWithPrices = await prisma.spreadHistory.count({
      where: {
        timestamp: { gte: oneDayAgo },
        spotPrice: { not: 0 },
        futuresPrice: { not: 0 }
      }
    });
    
    console.log(`\n📅 Últimas 24 horas:`);
    console.log(`   Total: ${recentTotal}`);
    console.log(`   Com preços: ${recentWithPrices}`);
    console.log(`   Percentual: ${((recentWithPrices / recentTotal) *100).toFixed(2)}%`);
    
    // Verificar alguns registros antigos sem preços
    const oldWithoutPrices = await prisma.spreadHistory.findMany({
      where: {
        timestamp: { lt: oneDayAgo },
        OR: [
          { spotPrice: 0 },
          { futuresPrice: 0 }
        ]
      },
      take: 5,
      orderBy: { timestamp: 'desc' }
    });
    
    console.log(`\n📋 Exemplos de registros antigos sem preços:`);
    oldWithoutPrices.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.symbol} - Spread: ${record.spread}% - Spot: ${record.spotPrice} - Futures: ${record.futuresPrice} - ${record.timestamp}`);
    });
    
  } catch (error) {
    console.error('❌ Erro na investigação:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigatePrices(); 