const fetch = require('node-fetch');

const baseURL = 'http://localhost:10000';

async function testPositionsPerformance() {
  console.log('🧪 Testando performance da API de posições...\n');

  const testCases = [
    {
      name: 'Posições sem filtro',
      url: '/api/positions'
    },
    {
      name: 'Posições com user_id (similar à outra plataforma)',
      url: '/api/positions?user_id=edilsonmatos'
    },
    {
      name: 'Posições com limite reduzido',
      url: '/api/positions?limit=20'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📊 Testando: ${testCase.name}`);
    console.log(`🔗 URL: ${baseURL}${testCase.url}`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${baseURL}${testCase.url}`);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Status: ${response.status} OK`);
        console.log(`⏱️  Duração: ${duration}ms`);
        console.log(`📦 Tamanho da resposta: ${JSON.stringify(data).length} bytes`);
        console.log(`📋 Posições retornadas: ${Array.isArray(data) ? data.length : 'N/A'}`);
        
        // Comparar com a outra plataforma (442ms)
        if (duration <= 442) {
          console.log(`🎯 Performance: MELHOR que a outra plataforma (${duration}ms vs 442ms)`);
        } else {
          console.log(`⚠️  Performance: PIOR que a outra plataforma (${duration}ms vs 442ms)`);
        }
      } else {
        console.log(`❌ Status: ${response.status} ${response.statusText}`);
        console.log(`⏱️  Duração: ${duration}ms`);
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`💥 Erro: ${error.message}`);
      console.log(`⏱️  Duração: ${duration}ms`);
    }
    
    console.log('─'.repeat(60));
    
    // Aguardar 1 segundo entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🏁 Teste de performance concluído!');
}

// Executar o teste
testPositionsPerformance().catch(console.error); 