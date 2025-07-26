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
  console.log('🚀 Testando APIs que ainda podem ter problemas...\n');
  
  const baseUrl = 'http://localhost:10000';
  
  // Teste 1: Config Manual Balances (que estava retornando 500)
  await testAPI(
    `${baseUrl}/api/config/manual-balances`,
    'Config Manual Balances'
  );
  
  // Teste 2: Config API Keys
  await testAPI(
    `${baseUrl}/api/config/api-keys`,
    'Config API Keys'
  );
  
  // Teste 3: Positions (que estava com timeout)
  await testAPI(
    `${baseUrl}/api/positions`,
    'Positions'
  );
  
  // Teste 4: Operation History (que estava com erro de conexão)
  await testAPI(
    `${baseUrl}/api/operation-history`,
    'Operation History'
  );
  
  // Teste 5: Spread History 24h (que estava retornando 503)
  await testAPI(
    `${baseUrl}/api/spread-history/24h/BTCUSDT`,
    'Spread History 24h'
  );
  
  // Teste 6: Spread History Principal (que estava retornando 503)
  await testAPI(
    `${baseUrl}/api/spread-history?symbol=BTCUSDT`,
    'Spread History Principal'
  );
  
  // Teste 7: Health Check (para verificar se servidor está estável)
  await testAPI(
    `${baseUrl}/api/health`,
    'Health Check'
  );
  
  console.log('\n🏁 Testes concluídos!');
  console.log('\n📊 ANÁLISE:');
  console.log('✅ APIs que devem retornar 200: Health, Config APIs, Positions, Operation History');
  console.log('✅ APIs que podem retornar 503: Spread History (quando banco indisponível)');
  console.log('✅ APIs que devem retornar array vazio: Manual Balances (quando sem dados)');
}

// Executar testes
runTests().catch(console.error); 