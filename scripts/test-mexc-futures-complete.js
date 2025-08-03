const fetch = require('node-fetch');

// Testar TODOS os possíveis endpoints de futures da MEXC
async function testAllMexcFuturesEndpoints() {
  console.log('🔍 TESTE COMPLETO - APIS DE FUTURES DA MEXC');
  console.log('============================================');
  
  const endpoints = [
    // Endpoints oficiais da MEXC
    'https://api.mexc.com/api/v3/ticker/24hr', // Spot (para comparação)
    'https://api.mexc.com/api/v3/futures/ticker/24hr',
    'https://api.mexc.com/api/v3/contract/ticker/24hr',
    'https://api.mexc.com/api/v3/futures/klines?symbol=BTCUSDT&interval=1m&limit=1',
    'https://api.mexc.com/api/v3/contract/klines?symbol=BTCUSDT&interval=1m&limit=1',
    'https://api.mexc.com/api/v3/futures/exchangeInfo',
    'https://api.mexc.com/api/v3/contract/exchangeInfo',
    'https://api.mexc.com/api/v3/futures/ticker/price',
    'https://api.mexc.com/api/v3/contract/ticker/price',
    
    // Endpoints alternativos
    'https://api.mexc.com/api/v3/futures/ticker/bookTicker',
    'https://api.mexc.com/api/v3/contract/ticker/bookTicker',
    'https://api.mexc.com/api/v3/futures/depth?symbol=BTCUSDT&limit=5',
    'https://api.mexc.com/api/v3/contract/depth?symbol=BTCUSDT&limit=5',
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
        results.push({ endpoint, status: 'error', message: `HTTP ${response.status}` });
        continue;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log(`✅ Resposta: Array com ${data.length} itens`);
        if (data.length > 0) {
          console.log(`📊 Primeiro item:`, JSON.stringify(data[0], null, 2));
          results.push({ endpoint, status: 'success', type: 'array', count: data.length });
        }
      } else {
        console.log(`✅ Resposta: Objeto`);
        console.log(`📊 Dados:`, JSON.stringify(data, null, 2));
        results.push({ endpoint, status: 'success', type: 'object' });
      }
      
    } catch (error) {
      console.error(`❌ Erro:`, error.message);
      results.push({ endpoint, status: 'error', message: error.message });
    }
  }
  
  // Resumo dos resultados
  console.log('\n📋 RESUMO DOS RESULTADOS');
  console.log('========================');
  
  const successful = results.filter(r => r.status === 'success');
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`✅ Endpoints funcionando: ${successful.length}`);
  console.log(`❌ Endpoints com erro: ${errors.length}`);
  
  console.log('\n🎯 ENDPOINTS DE FUTURES FUNCIONANDO:');
  successful.forEach(result => {
    if (result.endpoint.includes('futures') || result.endpoint.includes('contract')) {
      console.log(`  ✅ ${result.endpoint}`);
    }
  });
  
  console.log('\n❌ ENDPOINTS COM ERRO:');
  errors.forEach(result => {
    if (result.endpoint.includes('futures') || result.endpoint.includes('contract')) {
      console.log(`  ❌ ${result.endpoint} - ${result.message}`);
    }
  });
  
  return results;
}

// Testar especificamente por dados de BTC, ETH, SOL, BNB em futures
async function testSpecificFuturesPairs() {
  console.log('\n🔍 TESTANDO PARES ESPECÍFICOS EM FUTURES');
  console.log('=========================================');
  
  const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
  const futuresEndpoints = [
    'https://api.mexc.com/api/v3/futures/ticker/24hr',
    'https://api.mexc.com/api/v3/contract/ticker/24hr'
  ];
  
  for (const endpoint of futuresEndpoints) {
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
        const foundPairs = [];
        pairs.forEach(pair => {
          const found = data.find(item => item.symbol === pair);
          if (found) {
            foundPairs.push(pair);
            console.log(`  ✅ ${pair}: $${found.lastPrice}`);
          }
        });
        
        console.log(`📊 Pares encontrados: ${foundPairs.length}/${pairs.length}`);
        if (foundPairs.length > 0) {
          console.log(`  🎯 Encontrados: ${foundPairs.join(', ')}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Erro:`, error.message);
    }
  }
}

// Executar testes
async function runAllTests() {
  await testAllMexcFuturesEndpoints();
  await testSpecificFuturesPairs();
  
  console.log('\n🏁 TESTES CONCLUÍDOS');
  console.log('===================');
}

runAllTests().catch(console.error); 