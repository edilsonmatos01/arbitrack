const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkSymbolStatus() {
  try {
    console.log('🔍 Verificando status do símbolo SNS_USDT...');
    
    await prisma.$connect();
    console.log('✅ Conexão estabelecida');
    
    // Verificar dados do SNS_USDT
    const snsData = await prisma.spreadHistory.findMany({
      where: {
        symbol: 'SNS_USDT'
      },
      orderBy: [
        { timestamp: 'desc' }
      ],
      take: 10,
    });
    
    console.log(`📊 Total de registros para SNS_USDT: ${snsData.length}`);
    
    if (snsData.length > 0) {
      console.log('\n📋 Últimos registros do SNS_USDT:');
      snsData.forEach((record, index) => {
        const timeDiff = Date.now() - record.timestamp.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        console.log(`  ${index + 1}. Spread: ${record.spread}% - Spot: ${record.spotPrice} - Futures: ${record.futuresPrice} - ${minutesDiff}min atrás`);
      });
    }
    
    // Verificar símbolos com spreads similares (altos)
    const highSpreadSymbols = await prisma.spreadHistory.findMany({
      where: {
        spread: { gte: 10 }, // Spreads >= 10%
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
      },
      orderBy: [
        { timestamp: 'desc' }
      ],
      take: 10,
    });
    
    console.log(`\n📈 Símbolos com spreads altos (>=10%) nas últimas 24h:`);
    highSpreadSymbols.forEach((record, index) => {
      const timeDiff = Date.now() - record.timestamp.getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      console.log(`  ${index + 1}. ${record.symbol} - Spread: ${record.spread}% - ${minutesDiff}min atrás`);
    });
    
    // Verificar símbolos mais ativos recentemente
    const recentSymbols = await prisma.spreadHistory.findMany({
      where: {
        timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Última hora
      },
      orderBy: [
        { timestamp: 'desc' }
      ],
      take: 10,
    });
    
    console.log(`\n⚡ Símbolos mais ativos na última hora:`);
    const symbolCount = {};
    recentSymbols.forEach(record => {
      symbolCount[record.symbol] = (symbolCount[record.symbol] || 0) + 1;
    });
    
    Object.entries(symbolCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([symbol, count], index) => {
        console.log(`  ${index + 1}. ${symbol} - ${count} registros`);
      });
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSymbolStatus(); 