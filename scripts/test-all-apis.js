const fetch = require('node-fetch');

async function testAPI(url, description, method = 'GET', body = null) {
  try {
    console.log(`\n🧪 Testando: ${description}`);
    console.log(`📍 URL: ${url}`);
    console.log(`🔧 Método: ${method}`);
    
    const startTime = Date.now();
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const endTime = Date.now();
    
    console.log(`⏱️  Tempo de resposta: ${endTime - startTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Sucesso!`);
      
      if (Array.isArray(data)) {
        console.log(`📈 Dados recebidos: ${data.length} itens`);
        if (data.length > 0) {
          console.log(`📋 Primeiro item:`, data[0]);
        }
      } else if (typeof data === 'object') {
        console.log(`📈 Dados recebidos: objeto com ${Object.keys(data).length} propriedades`);
        if (data.data && Array.isArray(data.data)) {
          console.log(`📋 Primeiro item em data:`, data.data[0]);
        }
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
  console.log('🚀 Iniciando testes completos das APIs...\n');
  
  const baseUrl = 'http://localhost:10000';
  
  // Teste 1: Health Check
  await testAPI(
    `${baseUrl}/api/health`,
    'Health Check'
  );
  
  // Teste 2: Init Data Simple
  await testAPI(
    `${baseUrl}/api/init-data-simple?user_id=edilsonmatos`,
    'Init Data Simple'
  );
  
  // Teste 3: Spread History 24h
  await testAPI(
    `${baseUrl}/api/spread-history/24h/BTCUSDT`,
    'Spread History 24h'
  );
  
  // Teste 4: Spread History (API principal)
  await testAPI(
    `${baseUrl}/api/spread-history?symbol=BTCUSDT`,
    'Spread History Principal'
  );
  
  // Teste 5: Operation History
  await testAPI(
    `${baseUrl}/api/operation-history`,
    'Operation History'
  );
  
  // Teste 6: Positions
  await testAPI(
    `${baseUrl}/api/positions`,
    'Positions'
  );
  
  // Teste 7: MEXC Balance
  await testAPI(
    `${baseUrl}/api/mexc/wallet-balance`,
    'MEXC Balance'
  );
  
  // Teste 8: GateIO Balance
  await testAPI(
    `${baseUrl}/api/gateio/wallet-balance`,
    'GateIO Balance'
  );
  
  // Teste 9: Spread History com símbolo inválido (deve retornar 400)
  await testAPI(
    `${baseUrl}/api/spread-history/24h/`,
    'Spread History - Símbolo Inválido'
  );
  
  // Teste 10: Spread History sem parâmetro (deve retornar 400)
  await testAPI(
    `${baseUrl}/api/spread-history`,
    'Spread History - Sem Parâmetro'
  );
  
  console.log('\n🏁 Testes concluídos!');
  console.log('\n📊 RESUMO:');
  console.log('✅ APIs que devem funcionar: Health, Init Data, Spread History, Operation History, Positions, Balances');
  console.log('❌ APIs que devem retornar erro 400: Spread History com parâmetros inválidos');
  console.log('⚠️  Se houver erros 503, significa que o banco não está acessível (normal em desenvolvimento)');
}

// Executar testes
runTests().catch(console.error); 