const fetch = require('node-fetch');

async function testAPI(url, description) {
  try {
    console.log(`\n🧪 Testando: ${description}`);
    console.log(`📍 URL: ${url}`);
    
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();
    
    console.log(`⏱️  Tempo de resposta: ${endTime - startTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Sucesso! Dados recebidos: ${Array.isArray(data) ? data.length : 'objeto'}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`📈 Primeiro item:`, data[0]);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`💥 Exceção: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes das APIs de Spread History...\n');
  
  const baseUrl = 'http://localhost:10000';
  
  // Teste 1: API principal de spread history
  await testAPI(
    `${baseUrl}/api/spread-history?symbol=BTCUSDT`,
    'API Principal - Spread History'
  );
  
  // Teste 2: API de spread history 24h
  await testAPI(
    `${baseUrl}/api/spread-history/24h/BTCUSDT`,
    'API 24h - Spread History'
  );
  
  // Teste 3: API de spread history 24h com símbolo inválido
  await testAPI(
    `${baseUrl}/api/spread-history/24h/`,
    'API 24h - Símbolo inválido'
  );
  
  // Teste 4: API de spread history sem parâmetro
  await testAPI(
    `${baseUrl}/api/spread-history`,
    'API Principal - Sem parâmetro'
  );
  
  // Teste 5: API init-data-simple
  await testAPI(
    `${baseUrl}/api/init-data-simple?user_id=edilsonmatos`,
    'API Init Data Simple'
  );
  
  console.log('\n🏁 Testes concluídos!');
}

// Executar testes
runTests().catch(console.error); 