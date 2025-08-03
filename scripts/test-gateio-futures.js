const fetch = require('node-fetch');

// Testar API de futures da Gate.io
async function testGateioFutures() {
  console.log('🔍 TESTANDO API DE FUTURES DA GATE.IO');
  console.log('======================================');
  
  const endpoints = [
    'https://api.gateio.ws/api/v4/futures/usdt/contracts', // Futures contracts
    'https://api.gateio.ws/api/v4/futures/usdt/tickers', // Futures tickers
    'https://api.gateio.ws/api/v4/futures/usdt/contracts/BTC_USDT', // Specific contract
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log(`✅ Resposta: Array com ${data.length} itens`);
        
        // Procurar pelos pares específicos
        const pairs = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT'];
        const foundPairs = [];
        
        pairs.forEach(pair => {
          const found = data.find(item => item.name === pair);
          if (found) {
            foundPairs.push(pair);
            console.log(`  ✅ ${pair}: $${found.mark_price} (Funding: ${found.funding_rate}%)`);
          }
        });
        
        console.log(`📊 Pares encontrados: ${foundPairs.length}/${pairs.length}`);
        if (foundPairs.length > 0) {
          console.log(`  🎯 Encontrados: ${foundPairs.join(', ')}`);
        }
      } else {
        console.log(`✅ Resposta: Objeto`);
        console.log(`📊 Dados:`, JSON.stringify(data, null, 2));
      }
      
    } catch (error) {
      console.error(`❌ Erro:`, error.message);
    }
  }
}

// Executar teste
testGateioFutures().then(() => {
  console.log('\n🏁 TESTE GATE.IO FUTURES CONCLUÍDO');
}); 