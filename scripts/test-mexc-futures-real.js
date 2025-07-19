const fetch = require('node-fetch');

// Testar diferentes endpoints da MEXC para futures
async function testMexcFuturesAPIs() {
  console.log('🔍 TESTANDO APIS DE FUTURES DA MEXC');
  console.log('====================================');
  
  const endpoints = [
    'https://api.mexc.com/api/v3/ticker/24hr', // Spot
    'https://api.mexc.com/api/v3/ticker/price', // Spot prices
    'https://api.mexc.com/api/v3/exchangeInfo', // Exchange info
    'https://api.mexc.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1', // Klines
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log(`✅ Resposta: Array com ${data.length} itens`);
        if (data.length > 0) {
          console.log(`📊 Primeiro item:`, JSON.stringify(data[0], null, 2));
        }
      } else {
        console.log(`✅ Resposta: Objeto`);
        console.log(`📊 Dados:`, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error(`❌ Erro:`, error.message);
    }
  }
  
  // Testar especificamente por dados de futures
  console.log('\n🔍 PROCURANDO ESPECIFICAMENTE POR FUTURES...');
  
  try {
    // Tentar endpoint de futures (se existir)
    const futuresResponse = await fetch('https://api.mexc.com/api/v3/futures/ticker/24hr');
    const futuresData = await futuresResponse.json();
    console.log('✅ Endpoint de futures encontrado!');
    console.log('📊 Dados:', JSON.stringify(futuresData.slice(0, 2), null, 2));
  } catch (error) {
    console.log('❌ Endpoint de futures não encontrado');
  }
  
  try {
    // Tentar endpoint alternativo
    const altResponse = await fetch('https://api.mexc.com/api/v3/contract/ticker/24hr');
    const altData = await altResponse.json();
    console.log('✅ Endpoint de contract encontrado!');
    console.log('📊 Dados:', JSON.stringify(altData.slice(0, 2), null, 2));
  } catch (error) {
    console.log('❌ Endpoint de contract não encontrado');
  }
}

// Executar teste
testMexcFuturesAPIs().catch(console.error); 