const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function debugSnsData() {
  try {
    console.log('🔍 Debugando dados do SNS_USDT...');
    
    await prisma.$connect();
    console.log('✅ Conexão estabelecida');
    
    const symbol = 'SNS_USDT';
    const twentyFourHoursAgo = new Date(Date.now() - 24*60*60*1000);
    
    // Buscar todos os registros das últimas 24h
    const allRecords = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: { gte: twentyFourHoursAgo }
      },
      orderBy: [
        { timestamp: 'asc' }
      ]
    });
    
    console.log(`📊 Total de registros SNS_USDT nas últimas 24h: ${allRecords.length}`);
    
    if (allRecords.length === 0) {
      console.log('❌ Nenhum registro encontrado');
      return;
    }
    
    // Calcular estatísticas
    const spreads = allRecords.map(r => r.spread);
    const maxSpread = Math.max(...spreads);
    const minSpread = Math.min(...spreads);
    const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
    
    console.log(`\n📈 Estatísticas:`);
    console.log(`   Spread máximo: ${maxSpread.toFixed(2)}%`);
    console.log(`   Spread mínimo: ${minSpread.toFixed(2)}%`);
    console.log(`   Spread médio: ${avgSpread.toFixed(2)}%`);
    console.log(`   Total de registros: ${spreads.length}`);
    
    // Verificar registros com spreads altos (>10%)
    const highSpreads = allRecords.filter(r => r.spread > 10);
    console.log(`\n🚀 Registros com spread >10%: ${highSpreads.length}`);
    
    if (highSpreads.length > 0) {
      console.log('   Primeiros 5 registros com spread alto:');
      highSpreads.slice(0, 5).forEach((record, index) => {
        console.log(`   ${index + 1}. Spread: ${record.spread.toFixed(2)}% - ${record.timestamp}`);
      });
    }
    
    // Verificar registros com spreads baixos (<5%)
    const lowSpreads = allRecords.filter(r => r.spread < 5);
    console.log(`\n📉 Registros com spread <5%: ${lowSpreads.length}`);
    
    if (lowSpreads.length > 0) {
      console.log('   Primeiros 5 registros com spread baixo:');
      lowSpreads.slice(0, 5).forEach((record, index) => {
        console.log(`   ${index + 1}. Spread: ${record.spread.toFixed(2)}% - ${record.timestamp}`);
      });
    }
    
    // Verificar se há registros duplicados ou inconsistentes
    const uniqueSpreads = [...new Set(spreads)];
    console.log(`\n🔍 Spreads únicos: ${uniqueSpreads.length}`);
    console.log(`   Spreads únicos: ${uniqueSpreads.slice(0, 10).map(s => s.toFixed(2)).join(', ')}...`);
    
    // Verificar distribuição por hora
    const hourlyDistribution = {};
    allRecords.forEach(record => {
      const hour = record.timestamp.getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });
    
    console.log(`\n⏰ Distribuição por hora:`);
    Object.entries(hourlyDistribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([hour, count]) => {
        console.log(`   ${hour}h: ${count} registros`);
      });
    
    // Verificar se há problemas de timezone
    const recentRecords = allRecords.slice(-10);
    console.log(`\n🕐 Últimos 10 registros (timestamps):`);
    recentRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.timestamp.toISOString()} - Spread: ${record.spread.toFixed(2)}%`);
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugSnsData(); 