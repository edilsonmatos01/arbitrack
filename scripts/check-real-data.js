const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔍 VERIFICANDO SE OS DADOS SÃO REAIS');
console.log('====================================');

async function checkRealData() {
  console.log('\n📊 Analisando dados no banco...\n');
  
  try {
    // 1. Verificar SpreadHistory - últimos 10 registros
    console.log('📈 SPREAD HISTORY (últimos 10 registros):');
    console.log('==========================================');
    
    const spreadHistory = await prisma.spreadHistory.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' }
    });

    for (const record of spreadHistory) {
      console.log(`\n🎯 ${record.symbol}:`);
      console.log(`   Spread: ${record.spread.toFixed(4)}%`);
      console.log(`   Compra: ${record.exchangeBuy} @ $${record.spotPrice}`);
      console.log(`   Venda: ${record.exchangeSell} @ $${record.futuresPrice}`);
      console.log(`   Direção: ${record.direction}`);
      console.log(`   Timestamp: ${record.timestamp.toLocaleString()}`);
      
      // Verificar se os preços parecem reais
      const isRealPrice = record.spotPrice > 0.0001 && record.futuresPrice > 0.0001;
      const isRecent = (Date.now() - record.timestamp.getTime()) < 24 * 60 * 60 * 1000; // 24h
      
      console.log(`   ✅ Preços reais: ${isRealPrice ? 'SIM' : 'NÃO'}`);
      console.log(`   ✅ Dados recentes: ${isRecent ? 'SIM' : 'NÃO'}`);
    }

    // 2. Verificar PriceHistory - últimos 5 registros
    console.log('\n💰 PRICE HISTORY (últimos 5 registros):');
    console.log('========================================');
    
    const priceHistory = await prisma.priceHistory.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    });

    for (const record of priceHistory) {
      console.log(`\n🎯 ${record.symbol}:`);
      console.log(`   Gate.io Spot: Ask=${record.gateioSpotAsk}, Bid=${record.gateioSpotBid}`);
      console.log(`   MEXC Futures: Ask=${record.mexcFuturesAsk}, Bid=${record.mexcFuturesBid}`);
      console.log(`   Spread Gate→MEXC: ${record.gateioSpotToMexcFuturesSpread.toFixed(4)}%`);
      console.log(`   Timestamp: ${record.timestamp.toLocaleString()}`);
      
      // Verificar se os preços parecem reais
      const isRealPrice = record.gateioSpotAsk > 0.0001 && record.mexcFuturesBid > 0.0001;
      const isRecent = (Date.now() - record.timestamp.getTime()) < 24 * 60 * 60 * 1000;
      
      console.log(`   ✅ Preços reais: ${isRealPrice ? 'SIM' : 'NÃO'}`);
      console.log(`   ✅ Dados recentes: ${isRecent ? 'SIM' : 'NÃO'}`);
    }

    // 3. Verificar símbolos únicos
    console.log('\n📋 SÍMBOLOS ÚNICOS:');
    console.log('===================');
    
    const uniqueSymbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: { symbol: true }
    });

    console.log(`Total de símbolos únicos: ${uniqueSymbols.length}`);
    console.log('Símbolos encontrados:');
    uniqueSymbols.slice(0, 20).forEach(s => console.log(`   - ${s.symbol} (${s._count.symbol} registros)`));
    
    if (uniqueSymbols.length > 20) {
      console.log(`   ... e mais ${uniqueSymbols.length - 20} símbolos`);
    }

    // 4. Verificar distribuição temporal
    console.log('\n⏰ DISTRIBUIÇÃO TEMPORAL:');
    console.log('========================');
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recent1h = await prisma.spreadHistory.count({
      where: { timestamp: { gte: oneHourAgo } }
    });

    const recent6h = await prisma.spreadHistory.count({
      where: { timestamp: { gte: sixHoursAgo } }
    });

    const recent24h = await prisma.spreadHistory.count({
      where: { timestamp: { gte: oneDayAgo } }
    });

    console.log(`Última hora: ${recent1h} registros`);
    console.log(`Últimas 6 horas: ${recent6h} registros`);
    console.log(`Últimas 24 horas: ${recent24h} registros`);

    // 5. Verificar se há dados de teste
    console.log('\n🧪 DADOS DE TESTE:');
    console.log('==================');
    
    const testData = await prisma.spreadHistory.findMany({
      where: {
        OR: [
          { symbol: { contains: 'TEST' } },
          { symbol: { contains: 'test' } }
        ]
      }
    });

    if (testData.length > 0) {
      console.log(`⚠️  Encontrados ${testData.length} registros de teste:`);
      testData.forEach(record => {
        console.log(`   - ${record.symbol} (${record.timestamp.toLocaleString()})`);
      });
    } else {
      console.log('✅ Nenhum dado de teste encontrado');
    }

    // 6. Análise final
    console.log('\n📊 ANÁLISE FINAL:');
    console.log('=================');
    
    const totalRecords = await prisma.spreadHistory.count();
    const hasRecentData = recent1h > 0;
    const hasRealPrices = spreadHistory.every(r => r.spotPrice > 0.0001 && r.futuresPrice > 0.0001);
    const hasRealSymbols = uniqueSymbols.some(s => !s.symbol.includes('TEST'));
    
    console.log(`Total de registros: ${totalRecords}`);
    console.log(`Dados recentes (última hora): ${hasRecentData ? 'SIM' : 'NÃO'}`);
    console.log(`Preços realistas: ${hasRealPrices ? 'SIM' : 'NÃO'}`);
    console.log(`Símbolos reais: ${hasRealSymbols ? 'SIM' : 'NÃO'}`);
    
    if (hasRecentData && hasRealPrices && hasRealSymbols) {
      console.log('\n🎉 CONCLUSÃO: OS DADOS SÃO REAIS!');
      console.log('   ✅ Dados sendo atualizados em tempo real');
      console.log('   ✅ Preços realistas das exchanges');
      console.log('   ✅ Símbolos reais de criptomoedas');
    } else {
      console.log('\n⚠️  CONCLUSÃO: DADOS PARCIALMENTE REAIS OU DE TESTE');
      console.log('   ⚠️  Verificar se o worker está conectado às exchanges');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  }
}

// Executar verificação
checkRealData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  }); 