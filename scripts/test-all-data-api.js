const fetch = require('node-fetch');

async function testAllDataAPI() {
  try {
    console.log('Testando API /api/arbitrage/all-data...');
    
    const response = await fetch('http://localhost:10000/api/arbitrage/all-data');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API respondeu com sucesso');
    console.log(`📊 Símbolos processados: ${Object.keys(data.maxSpreads).length}`);
    console.log(`📈 Spreads máximos encontrados: ${Object.values(data.maxSpreads).filter(s => s.spMax !== null).length}`);
    console.log(`🕒 Timestamp: ${data.timestamp}`);
    
    // Mostrar alguns exemplos de spreads máximos
    console.log('\n📋 Exemplos de spreads máximos:');
    Object.entries(data.maxSpreads).forEach(([symbol, stats]) => {
      if (stats.spMax !== null) {
        console.log(`  ${symbol}: ${stats.spMax.toFixed(2)}% (${stats.crosses} registros)`);
      } else {
        console.log(`  ${symbol}: N/D (${stats.crosses} registros)`);
      }
    });
    
    // Verificar dados de gráficos
    console.log('\n📊 Dados de gráficos:');
    Object.entries(data.chartData).forEach(([symbol, chartData]) => {
      console.log(`  ${symbol}: ${chartData.spreadHistory.length} pontos de spread, ${chartData.priceComparison.length} pontos de preço`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testAllDataAPI(); 