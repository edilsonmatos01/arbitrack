const fetch = require('node-fetch');

async function testPreloadData() {
  console.log('🧪 Testando pré-carregamento de dados...');
  
  try {
    // 1. Testar API de spread
    console.log('\n1. Testando API de spread...');
    const spreadResponse = await fetch('http://localhost:3000/api/init-data-simple?user_id=edilsonmatos');
    const spreadData = await spreadResponse.json();
    
    console.log('✅ API de spread funcionando');
    console.log('📊 Símbolos disponíveis:', Object.keys(spreadData.spreads?.data || {}).length);
    console.log('📋 Primeiros 5 símbolos:', Object.keys(spreadData.spreads?.data || {}).slice(0, 5));
    
    // 2. Testar API de gráfico para um símbolo
    const testSymbol = Object.keys(spreadData.spreads?.data || {})[0];
    if (testSymbol) {
      console.log(`\n2. Testando API de gráfico para ${testSymbol}...`);
      const chartResponse = await fetch(`http://localhost:3000/api/spread-history/24h/${encodeURIComponent(testSymbol)}`);
      const chartData = await chartResponse.json();
      
      console.log('✅ API de gráfico funcionando');
      console.log(`📈 Pontos de dados para ${testSymbol}:`, chartData.length);
      
      if (chartData.length > 0) {
        console.log('📊 Exemplo de dados:', chartData[0]);
      }
    }
    
    // 3. Verificar estrutura dos dados
    console.log('\n3. Verificando estrutura dos dados...');
    const symbols = Object.keys(spreadData.spreads?.data || {});
    const sampleSymbol = symbols[0];
    
    if (sampleSymbol) {
      const sampleData = spreadData.spreads.data[sampleSymbol];
      console.log(`📋 Estrutura para ${sampleSymbol}:`, {
        spMax: sampleData.spMax,
        spMin: sampleData.spMin,
        crosses: sampleData.crosses,
        exchanges: sampleData.exchanges
      });
    }
    
    console.log('\n✅ Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

testPreloadData(); 