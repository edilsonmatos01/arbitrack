const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugLAT_USDT() {
  try {
    console.log('🔍 Debugando LAT_USDT...\n');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // 1. Buscar todos os registros das últimas 24h
    const allRecords = await prisma.spreadHistory.findMany({
      where: {
        symbol: 'LAT_USDT',
        timestamp: {
          gte: twentyFourHoursAgo,
        }
      },
      select: {
        id: true,
        timestamp: true,
        spread: true,
        spotPrice: true,
        futuresPrice: true,
        exchangeBuy: true,
        exchangeSell: true,
        direction: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    console.log(`📊 Total de registros encontrados: ${allRecords.length}`);
    
    if (allRecords.length === 0) {
      console.log('❌ Nenhum registro encontrado para LAT_USDT');
      return;
    }

    // 2. Análise dos spreads
    const spreads = allRecords.map(r => r.spread).filter(s => s > 0);
    const maxSpread = Math.max(...spreads);
    const minSpread = Math.min(...spreads);
    const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;

    console.log(`📈 Análise de Spreads:`);
    console.log(`   Máximo: ${maxSpread.toFixed(4)}%`);
    console.log(`   Mínimo: ${minSpread.toFixed(4)}%`);
    console.log(`   Média: ${avgSpread.toFixed(4)}%`);
    console.log(`   Total de spreads válidos: ${spreads.length}`);

    // 3. Top 10 maiores spreads
    console.log(`\n🏆 Top 10 maiores spreads:`);
    const topSpreads = allRecords
      .filter(r => r.spread > 0)
      .sort((a, b) => b.spread - a.spread)
      .slice(0, 10);

    topSpreads.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.spread.toFixed(4)}% - ${record.timestamp.toISOString()}`);
    });

    // 4. Verificar se há registros com spread > 4.99%
    const highSpreads = allRecords.filter(r => r.spread > 4.99);
    console.log(`\n🚨 Registros com spread > 4.99%: ${highSpreads.length}`);
    
    if (highSpreads.length > 0) {
      console.log('   Detalhes dos registros com spread alto:');
      highSpreads.forEach(record => {
        console.log(`   - ${record.spread.toFixed(4)}% em ${record.timestamp.toISOString()}`);
      });
    }

    // 5. Verificar se há registros com spread > 1.61%
    const mediumSpreads = allRecords.filter(r => r.spread > 1.61);
    console.log(`\n📊 Registros com spread > 1.61%: ${mediumSpreads.length}`);

    // 6. Análise por hora
    console.log(`\n⏰ Análise por hora (últimas 24h):`);
    const hourlyData = {};
    
    allRecords.forEach(record => {
      const hour = record.timestamp.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(record.spread);
    });

    Object.keys(hourlyData).sort().forEach(hour => {
      const spreads = hourlyData[hour];
      const max = Math.max(...spreads);
      const count = spreads.length;
      console.log(`   ${hour}h: ${count} registros, max: ${max.toFixed(4)}%`);
    });

    // 7. Verificar dados simulados vs reais
    const hasRealData = allRecords.some(r => r.spotPrice > 0 && r.futuresPrice > 0);
    console.log(`\n💾 Dados reais vs simulados:`);
    console.log(`   Tem dados reais (preços > 0): ${hasRealData ? 'SIM' : 'NÃO'}`);
    
    const realDataCount = allRecords.filter(r => r.spotPrice > 0 && r.futuresPrice > 0).length;
    console.log(`   Registros com dados reais: ${realDataCount}/${allRecords.length}`);

    // 8. Testar as APIs
    console.log(`\n🔗 Testando APIs...`);
    
    // Testar API da tabela
    try {
      const tableResponse = await fetch('http://localhost:3000/api/spreads/LAT_USDT/max');
      const tableData = await tableResponse.json();
      console.log(`   API Tabela (/api/spreads/LAT_USDT/max):`);
      console.log(`     spMax: ${tableData.spMax}`);
      console.log(`     crosses: ${tableData.crosses}`);
    } catch (error) {
      console.log(`   ❌ Erro ao testar API da tabela: ${error.message}`);
    }

    // Testar API do gráfico
    try {
      const chartResponse = await fetch('http://localhost:3000/api/spread-history/24h/LAT_USDT');
      const chartData = await chartResponse.json();
      console.log(`   API Gráfico (/api/spread-history/24h/LAT_USDT):`);
      console.log(`     Registros: ${chartData.length}`);
      if (chartData.length > 0) {
        const chartMax = Math.max(...chartData.map(d => d.spread_percentage));
        console.log(`     Máximo no gráfico: ${chartMax.toFixed(4)}%`);
      }
    } catch (error) {
      console.log(`   ❌ Erro ao testar API do gráfico: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLAT_USDT(); 