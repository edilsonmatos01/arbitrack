const fetch = require('node-fetch');

// Testar endpoints alternativos da MEXC para futures
async function testMexcFuturesV2() {
  console.log('🔍 TESTANDO ENDPOINTS ALTERNATIVOS DE FUTURES DA MEXC');
  console.log('=====================================================');
  
  const endpoints = [
    // Endpoints alternativos baseados na documentação da MEXC
    'https://api.mexc.com/api/v3/ticker/24hr', // Spot (funciona)
    'https://api.mexc.com/api/v3/futures/ticker/24hr', // Tentativa 1
    'https://api.mexc.com/api/v3/contract/ticker/24hr', // Tentativa 2
    'https://api.mexc.com/api/v3/perpetual/ticker/24hr', // Tentativa 3
    'https://api.mexc.com/api/v3/swap/ticker/24hr', // Tentativa 4
    
    // Endpoints específicos para pares
    'https://api.mexc.com/api/v3/ticker/24hr?symbol=BTCUSDT', // Spot específico
    'https://api.mexc.com/api/v3/futures/ticker/24hr?symbol=BTCUSDT', // Futures específico
    'https://api.mexc.com/api/v3/contract/ticker/24hr?symbol=BTCUSDT', // Contract específico
    
    // Endpoints de preços
    'https://api.mexc.com/api/v3/ticker/price', // Spot prices
    'https://api.mexc.com/api/v3/futures/ticker/price', // Futures prices
    'https://api.mexc.com/api/v3/contract/ticker/price', // Contract prices
    
    // Endpoints de exchange info
    'https://api.mexc.com/api/v3/exchangeInfo', // Spot info
    'https://api.mexc.com/api/v3/futures/exchangeInfo', // Futures info
    'https://api.mexc.com/api/v3/contract/exchangeInfo', // Contract info
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
        if (data.length > 0) {
          console.log(`📊 Primeiro item:`, JSON.stringify(data[0], null, 2));
          
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
          
          if (foundPairs.length > 0) {
            console.log(`  🎯 Pares encontrados: ${foundPairs.join(', ')}`);
          }
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

// Verificar se há endpoints específicos para perpétuos
async function checkMexcPerpetuals() {
  console.log('\n🔍 VERIFICANDO ENDPOINTS ESPECÍFICOS PARA PERPÉTUOS');
  console.log('====================================================');
  
  // Tentar endpoints específicos para perpétuos
  const perpetualEndpoints = [
    'https://api.mexc.com/api/v3/perpetual/ticker/24hr',
    'https://api.mexc.com/api/v3/swap/ticker/24hr',
    'https://api.mexc.com/api/v3/linear/ticker/24hr',
    'https://api.mexc.com/api/v3/inverse/ticker/24hr',
    'https://api.mexc.com/api/v3/usdt/ticker/24hr',
    'https://api.mexc.com/api/v3/btc/ticker/24hr',
  ];
  
  for (const endpoint of perpetualEndpoints) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ Resposta: ${Array.isArray(data) ? `Array com ${data.length} itens` : 'Objeto'}`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`📊 Primeiro item:`, JSON.stringify(data[0], null, 2));
      }
      
    } catch (error) {
      console.error(`❌ Erro:`, error.message);
    }
  }
}

// Executar testes
async function runAllTests() {
  await testMexcFuturesV2();
  await checkMexcPerpetuals();
  
  console.log('\n🏁 TESTES CONCLUÍDOS');
  console.log('===================');
  console.log('\n💡 CONCLUSÃO:');
  console.log('Se nenhum endpoint de futures funcionou, pode ser que:');
  console.log('1. A MEXC não ofereça API pública para futures');
  console.log('2. Os endpoints estejam em uma URL diferente');
  console.log('3. Seja necessário autenticação para acessar futures');
}

runAllTests().catch(console.error); 