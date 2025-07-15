const fetch = require('node-fetch');

async function testPerformance() {
  console.log('⚡ Testando performance das APIs de gráficos...');
  
  const baseUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  const symbol = 'TOMI_USDT';
  
  const endpoints = [
    `/api/spread-history?symbol=${encodeURIComponent(symbol)}`,
    `/api/spread-history/24h/${encodeURIComponent(symbol)}`,
    `/api/price-comparison/${encodeURIComponent(symbol)}`,
    `/api/operation-history?filter=all`
  ];
  
  console.log(`\n📊 Testando com símbolo: ${symbol}`);
  
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
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`📋 Primeiro item:`, JSON.stringify(data[0], null, 2));
        console.log(`📋 Último item:`, JSON.stringify(data[data.length - 1], null, 2));
      }
      
      // Análise de performance
      if (responseTime > 2000) {
        console.log(`⚠️ LENTO: ${responseTime}ms (acima de 2s)`);
      } else if (responseTime > 1000) {
        console.log(`🟡 MÉDIO: ${responseTime}ms (1-2s)`);
      } else {
        console.log(`✅ RÁPIDO: ${responseTime}ms (abaixo de 1s)`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao testar ${endpoint}:`, error.message);
    }
  }
  
  console.log('\n🔍 ANÁLISE DE PERFORMANCE:');
  console.log('1. APIs com tempo > 2s são consideradas LENTAS');
  console.log('2. APIs com tempo 1-2s são consideradas MÉDIAS');
  console.log('3. APIs com tempo < 1s são consideradas RÁPIDAS');
  console.log('\n💡 OTIMIZAÇÕES SUGERIDAS:');
  console.log('• Implementar cache Redis para dados históricos');
  console.log('• Usar índices no banco de dados para consultas por timestamp');
  console.log('• Implementar paginação para grandes volumes de dados');
  console.log('• Usar WebSocket para atualizações em tempo real');
  console.log('• Implementar lazy loading nos gráficos');
}

testPerformance().catch(console.error); 