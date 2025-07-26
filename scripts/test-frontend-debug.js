const fetch = require('node-fetch');

async function testFrontendDebug() {
  try {
    console.log('🧪 Testando acesso do frontend à API...');
    
    // Simular o que o frontend faz
    const response = await fetch('http://localhost:10000/api/init-data-simple');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API acessível pelo frontend');
    console.log('📊 Dados recebidos:');
    console.log(`   Timestamp: ${data.timestamp}`);
    console.log(`   Símbolos: ${data.symbols?.length || 0}`);
    console.log(`   Spreads máximos: ${data.maxSpreads?.length || 0}`);
    
    // Testar se os dados estão no formato esperado
    if (data.maxSpreads && Array.isArray(data.maxSpreads)) {
      console.log('\n📈 Spreads máximos:');
      data.maxSpreads.forEach(spread => {
        console.log(`   ${spread.symbol}: ${spread.maxSpread}% (${spread.count} registros)`);
      });
      
      // Testar busca por símbolo específico (como o frontend faz)
      const testSymbol = 'WHITE_USDT';
      const foundSpread = data.maxSpreads.find(s => s.symbol === testSymbol);
      
      console.log(`\n🔍 Teste de busca por ${testSymbol}:`);
      console.log(`   Encontrado: ${!!foundSpread}`);
      console.log(`   Valor: ${foundSpread?.maxSpread || 0}%`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar frontend:', error.message);
  }
}

testFrontendDebug(); 