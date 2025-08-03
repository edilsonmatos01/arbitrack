const fetch = require('node-fetch');

async function testFixes() {
  console.log('🔧 Testando correções dos erros...\\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Teste 1: API de posições (sem user_id)
    console.log('📊 Testando API de posições...');
    const positionsResponse = await fetch(`${baseUrl}/api/positions`);
    console.log(`📊 Status: ${positionsResponse.status}`);
    
    if (positionsResponse.ok) {
      const positionsData = await positionsResponse.json();
      console.log(`✅ API de posições funcionando - ${positionsData.length} posições encontradas`);
    } else {
      console.log(`❌ Erro na API de posições: ${positionsResponse.status}`);
    }
    
    // Teste 2: API de arbitragem
    console.log('\\n📈 Testando API de arbitragem...');
    const arbitrageResponse = await fetch(`${baseUrl}/api/arbitrage/all-data`);
    console.log(`📈 Status: ${arbitrageResponse.status}`);
    
    if (arbitrageResponse.ok) {
      const arbitrageData = await arbitrageResponse.json();
      console.log(`✅ API de arbitragem funcionando - ${arbitrageData.length} oportunidades encontradas`);
    } else {
      console.log(`❌ Erro na API de arbitragem: ${arbitrageResponse.status}`);
    }
    
    // Teste 3: API de spread history
    console.log('\\n📊 Testando API de spread history...');
    const spreadResponse = await fetch(`${baseUrl}/api/spread-history/24h/WHITE_USDT`);
    console.log(`📊 Status: ${spreadResponse.status}`);
    
    if (spreadResponse.ok) {
      const spreadData = await spreadResponse.json();
      console.log(`✅ API de spread history funcionando - ${Array.isArray(spreadData) ? spreadData.length : 'N/A'} dados encontrados`);
    } else {
      console.log(`❌ Erro na API de spread history: ${spreadResponse.status}`);
    }
    
    console.log('\\n🎉 Testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testFixes(); 