const fetch = require('node-fetch');

// Testar API de futures da Binance
async function testBinanceFutures() {
  console.log('🔍 TESTANDO API DE FUTURES DA BINANCE');
  console.log('======================================');
  
  const endpoints = [
    'https://fapi.binance.com/fapi/v1/ticker/24hr', // Futures
    'https://fapi.binance.com/fapi/v1/ticker/price', // Futures prices
    'https://fapi.binance.com/fapi/v1/exchangeInfo', // Futures info
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
        const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
        const foundPairs = [];
        
        pairs.forEach(pair => {
          const found = data.find(item => item.symbol === pair);
          if (found) {
            foundPairs.push(pair);
            console.log(`  ✅ ${pair}: $${found.lastPrice || found.price}`);
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
testBinanceFutures().then(() => {
  console.log('\n🏁 TESTE BINANCE CONCLUÍDO');
}); 