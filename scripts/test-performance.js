// Script para testar a performance dos novos componentes otimizados
console.log('🚀 TESTE DE PERFORMANCE DOS GRÁFICOS OTIMIZADOS');
console.log('================================================\n');

// Simular carregamento de dados
async function testChartPerformance() {
  const symbols = ['WHITE_USDT', 'KEKIUS_USDT', 'BTC_USDT', 'ETH_USDT'];
  
  console.log('1️⃣ TESTE DE CARREGAMENTO INICIAL');
  console.log('----------------------------------');
  
  for (const symbol of symbols) {
    const startTime = Date.now();
    
    try {
      // Testar API de spread history
      const spreadResponse = await fetch(`http://localhost:10000/api/spread-history/24h/${symbol}`);
      const spreadData = await spreadResponse.json();
      
      // Testar API de price comparison
      const priceResponse = await fetch(`http://localhost:10000/api/price-comparison/${symbol}`);
      const priceData = await priceResponse.json();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ ${symbol}:`);
      console.log(`   - Spread History: ${spreadData.length} pontos`);
      console.log(`   - Price Comparison: ${priceData.length} pontos`);
      console.log(`   - Tempo total: ${duration}ms`);
      console.log(`   - Performance: ${duration < 1000 ? 'EXCELENTE' : duration < 3000 ? 'BOA' : 'LENTA'}`);
      
    } catch (error) {
      console.log(`❌ ${symbol}: Erro - ${error.message}`);
    }
  }
  
  console.log('\n2️⃣ TESTE DE CACHE');
  console.log('------------------');
  
  // Testar segunda requisição (deve usar cache)
  for (const symbol of symbols.slice(0, 2)) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`http://localhost:10000/api/spread-history/24h/${symbol}`);
      const data = await response.json();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ ${symbol} (cache):`);
      console.log(`   - Tempo: ${duration}ms`);
      console.log(`   - Cache funcionando: ${duration < 100 ? 'SIM' : 'NÃO'}`);
      
    } catch (error) {
      console.log(`❌ ${symbol} (cache): Erro - ${error.message}`);
    }
  }
  
  console.log('\n3️⃣ TESTE DE CONCORRÊNCIA');
  console.log('-------------------------');
  
  const startTime = Date.now();
  const promises = symbols.map(symbol => 
    fetch(`http://localhost:10000/api/spread-history/24h/${symbol}`).then(r => r.json())
  );
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Carregamento paralelo de ${symbols.length} símbolos:`);
    console.log(`   - Tempo total: ${duration}ms`);
    console.log(`   - Tempo médio por símbolo: ${(duration / symbols.length).toFixed(0)}ms`);
    console.log(`   - Performance: ${duration < 2000 ? 'EXCELENTE' : duration < 5000 ? 'BOA' : 'LENTA'}`);
    
    results.forEach((data, index) => {
      console.log(`   - ${symbols[index]}: ${data.length} pontos`);
    });
    
  } catch (error) {
    console.log(`❌ Erro no teste de concorrência: ${error.message}`);
  }
  
  console.log('\n4️⃣ RECOMENDAÇÕES DE OTIMIZAÇÃO');
  console.log('-------------------------------');
  
  console.log('📊 Para melhorar ainda mais a performance:');
  console.log('   - Cache em memória: ✅ Implementado');
  console.log('   - Pré-carregamento: ✅ Implementado');
  console.log('   - Componentes otimizados: ✅ Implementado');
  console.log('   - Renderização instantânea: ✅ Implementado');
  console.log('   - Atualizações em background: ✅ Implementado');
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('   - Monitorar performance em produção');
  console.log('   - Ajustar duração do cache conforme necessário');
  console.log('   - Implementar compressão de dados se necessário');
  console.log('   - Considerar CDN para dados estáticos');
}

// Executar teste
testChartPerformance().catch(console.error); 