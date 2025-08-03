const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testando API simples...');
    
    // Testar se o servidor está respondendo
    const response = await fetch('http://localhost:10000/api/health');
    console.log('Health check:', response.status);
    
    // Testar a API all-data
    console.log('\nTestando /api/arbitrage/all-data...');
    const allDataResponse = await fetch('http://localhost:10000/api/arbitrage/all-data');
    
    if (!allDataResponse.ok) {
      console.error('Erro na API all-data:', allDataResponse.status, allDataResponse.statusText);
      const errorText = await allDataResponse.text();
      console.error('Erro detalhado:', errorText);
      return;
    }
    
    const data = await allDataResponse.json();
    console.log('✅ API respondeu com sucesso');
    console.log('📊 Estrutura dos dados:', {
      hasMaxSpreads: !!data.maxSpreads,
      hasChartData: !!data.chartData,
      maxSpreadsKeys: Object.keys(data.maxSpreads || {}),
      timestamp: data.timestamp
    });
    
    // Verificar alguns símbolos específicos
    const symbols = ['ERA_USDT', 'WHITE_USDT', 'NAM_USDT'];
    symbols.forEach(symbol => {
      const maxSpread = data.maxSpreads?.[symbol];
      console.log(`${symbol}:`, maxSpread ? `${maxSpread.spMax?.toFixed(2)}% (${maxSpread.crosses} registros)` : 'N/D');
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testAPI(); 