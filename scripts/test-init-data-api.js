const fetch = require('node-fetch');

const baseURL = 'http://localhost:10000';

async function testInitDataAPI() {
  console.log('🧪 Testando nova API unificada /api/init-data...\n');

  const testCases = [
    {
      name: 'Dados completos com user_id',
      url: '/api/init-data?user_id=edilsonmatos'
    },
    {
      name: 'Dados sem user_id (usar padrão)',
      url: '/api/init-data'
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
        
        // Analisar estrutura da resposta
        console.log(`📋 Estrutura da resposta:`);
        console.log(`   - Posições abertas: ${data.positions?.open?.length || 0}`);
        console.log(`   - Posições fechadas: ${data.positions?.closed?.length || 0}`);
        console.log(`   - Spreads disponíveis: ${Object.keys(data.spreads?.data || {}).length}`);
        console.log(`   - Pares Gate.io: ${data.pairs?.gateio?.length || 0}`);
        console.log(`   - Pares MEXC: ${data.pairs?.mexc?.length || 0}`);
        console.log(`   - Pares Bitget: ${data.pairs?.bitget?.length || 0}`);
        
        // Mostrar alguns exemplos de spreads
        const spreadKeys = Object.keys(data.spreads?.data || {});
        if (spreadKeys.length > 0) {
          console.log(`📈 Exemplos de spreads:`);
          spreadKeys.slice(0, 3).forEach(key => {
            const spread = data.spreads.data[key];
            console.log(`   - ${key}: Max=${spread.spMax}%, Min=${spread.spMin}%, Crosses=${spread.crosses}`);
          });
        }
        
        // Mostrar algumas posições se existirem
        if (data.positions?.closed?.length > 0) {
          console.log(`💰 Exemplos de posições:`);
          data.positions.closed.slice(0, 2).forEach(pos => {
            console.log(`   - ${pos.asset}: ${pos.exchange}, PnL=${pos.pnl}, Status=${pos.status}`);
          });
        }
        
        // Comparar com a outra plataforma (440ms)
        if (duration <= 440) {
          console.log(`🎯 Performance: MELHOR que a outra plataforma (${duration}ms vs 440ms)`);
        } else {
          console.log(`⚠️  Performance: PIOR que a outra plataforma (${duration}ms vs 440ms)`);
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
    
    console.log('─'.repeat(80));
    
    // Aguardar 2 segundos entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🏁 Teste da API unificada concluído!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Testar no frontend');
  console.log('   2. Verificar se os spreads aparecem corretamente');
  console.log('   3. Verificar se as posições são exibidas');
  console.log('   4. Comparar performance com a outra plataforma');
}

// Executar o teste
testInitDataAPI().catch(console.error); 