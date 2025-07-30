const fetch = require('node-fetch');

async function testOptimizedPerformance() {
  console.log('⚡ Testando performance das APIs OTIMIZADAS...');
  
  const baseUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  const symbol = 'TOMI_USDT';
  
  const endpoints = [
    `/api/spread-history/optimized?symbol=${encodeURIComponent(symbol)}`,
    `/api/spread-history?symbol=${encodeURIComponent(symbol)}`,
    `/api/spread-history/24h/${encodeURIComponent(symbol)}`,
    `/api/price-comparison/${encodeURIComponent(symbol)}`,
    `/api/operation-history?filter=all`
  ];
  
  console.log(`\n📊 Testando com símbolo: ${symbol}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}${endpoint}`);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      const data = await response.json();
      
      console.log(`⏱️ Tempo de resposta: ${responseTime}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📈 Quantidade de dados: ${Array.isArray(data) ? data.length : 'N/A'}`);
      
      // Análise de performance
      let performance = '';
      if (responseTime > 2000) {
        performance = `⚠️ LENTO: ${responseTime}ms (acima de 2s)`;
      } else if (responseTime > 1000) {
        performance = `🟡 MÉDIO: ${responseTime}ms (1-2s)`;
      } else {
        performance = `✅ RÁPIDO: ${responseTime}ms (abaixo de 1s)`;
      }
      
      console.log(performance);
      
      results.push({
        endpoint,
        responseTime,
        status: response.status,
        dataCount: Array.isArray(data) ? data.length : 0,
        performance: responseTime > 2000 ? 'LENTO' : responseTime > 1000 ? 'MÉDIO' : 'RÁPIDO'
      });
      
    } catch (error) {
      console.error(`❌ Erro ao testar ${endpoint}:`, error.message);
      results.push({
        endpoint,
        responseTime: -1,
        status: 'ERROR',
        dataCount: 0,
        performance: 'ERRO'
      });
    }
  }
  
  console.log('\n📊 RESUMO DE PERFORMANCE:');
  console.log('='.repeat(80));
  
  results.forEach((result, index) => {
    const endpointName = result.endpoint.split('/').pop() || result.endpoint;
    const status = result.responseTime === -1 ? '❌ ERRO' : 
                   result.performance === 'RÁPIDO' ? '✅ RÁPIDO' :
                   result.performance === 'MÉDIO' ? '🟡 MÉDIO' : '⚠️ LENTO';
    
    console.log(`${index + 1}. ${endpointName.padEnd(30)} | ${result.responseTime}ms | ${status}`);
  });
  
  console.log('='.repeat(80));
  
  const fastCount = results.filter(r => r.performance === 'RÁPIDO').length;
  const mediumCount = results.filter(r => r.performance === 'MÉDIO').length;
  const slowCount = results.filter(r => r.performance === 'LENTO').length;
  const errorCount = results.filter(r => r.performance === 'ERRO').length;
  
  console.log(`\n📈 ESTATÍSTICAS:`);
  console.log(`✅ Rápidas (< 1s): ${fastCount}`);
  console.log(`🟡 Médias (1-2s): ${mediumCount}`);
  console.log(`⚠️ Lentas (> 2s): ${slowCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  
  if (slowCount > 0) {
    console.log('\n💡 RECOMENDAÇÕES ADICIONAIS:');
    console.log('• Implementar Redis para cache distribuído');
    console.log('• Usar CDN para dados estáticos');
    console.log('• Implementar paginação para grandes datasets');
    console.log('• Considerar usar TimescaleDB para dados temporais');
    console.log('• Implementar cache em memória compartilhada');
  }
}

testOptimizedPerformance().catch(console.error); 