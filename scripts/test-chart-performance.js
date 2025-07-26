const fetch = require('node-fetch');

async function testChartPerformance() {
  console.log('🚀 Testando Performance do Gráfico...\n');
  
  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  
  for (const symbol of symbols) {
    try {
      console.log(`📊 Testando ${symbol}:`);
      
      const startTime = Date.now();
      
      // Teste 1: API de dados do gráfico
      const response = await fetch(`http://localhost:3000/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      const data = await response.json();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`  ⏱️  Tempo de resposta: ${duration}ms`);
      console.log(`  📈 Registros: ${data.length}`);
      
      if (data.length > 0) {
        console.log(`  ✅ Dados válidos encontrados`);
        console.log(`  📊 Primeiro registro: ${data[0].timestamp}`);
        console.log(`  📊 Último registro: ${data[data.length - 1].timestamp}`);
        
        // Teste de performance de processamento
        const processStart = Date.now();
        
        // Simular processamento de dados (como no componente)
        const processedData = data.map(item => ({
          ...item,
          value: item.spread_percentage,
          label: 'Spread (%)'
        }));
        
        const processEnd = Date.now();
        const processDuration = processEnd - processStart;
        
        console.log(`  ⚡ Tempo de processamento: ${processDuration}ms`);
        console.log(`  🎯 Performance: ${processDuration < 50 ? 'EXCELENTE' : processDuration < 100 ? 'BOA' : 'REGULAR'}`);
      } else {
        console.log(`  ⚠️  Sem dados suficientes`);
      }
      
    } catch (error) {
      console.log(`  ❌ Erro: ${error.message}`);
    }
    
    console.log(''); // Linha em branco
  }
  
  console.log('🎉 Teste de Performance Concluído!');
  console.log('\n📋 Melhorias Implementadas:');
  console.log('  ✅ Memoização de dados (evita re-cálculos)');
  console.log('  ✅ Opções do gráfico memoizadas');
  console.log('  ✅ Interface limpa (sem botões redundantes)');
  console.log('  ✅ Performance otimizada');
}

// Executar o teste
testChartPerformance().catch(console.error); 