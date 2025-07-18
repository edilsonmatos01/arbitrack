const fetch = require('node-fetch');

// Configurações de teste
const BASE_URL = 'http://localhost:10000';
const TEST_ITERATIONS = 5;
const CONCURRENT_REQUESTS = 10;

// Função para medir tempo de resposta
async function measureResponseTime(url, options = {}) {
  const start = Date.now();
  try {
    const response = await fetch(url, options);
    const end = Date.now();
    const responseTime = end - start;
    
    return {
      success: response.ok,
      status: response.status,
      time: responseTime,
      size: response.headers.get('content-length') || 'unknown'
    };
  } catch (error) {
    const end = Date.now();
    return {
      success: false,
      error: error.message,
      time: end - start
    };
  }
}

// Função para calcular estatísticas
function calculateStats(times) {
  const validTimes = times.filter(t => t.success);
  if (validTimes.length === 0) return null;
  
  const responseTimes = validTimes.map(t => t.time);
  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const min = Math.min(...responseTimes);
  const max = Math.max(...responseTimes);
  const successRate = (validTimes.length / times.length) * 100;
  
  return {
    avg: Math.round(avg),
    min,
    max,
    successRate: Math.round(successRate),
    total: validTimes.length,
    failed: times.length - validTimes.length
  };
}

// Teste de API individual
async function testAPI(apiName, url, options = {}) {
  console.log(`\n🔍 Testando: ${apiName}`);
  console.log(`📡 URL: ${url}`);
  
  const results = [];
  
  // Teste sequencial
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const result = await measureResponseTime(url, options);
    results.push(result);
    
    if (result.success) {
      console.log(`   ✅ Tentativa ${i + 1}: ${result.time}ms (${result.status})`);
    } else {
      console.log(`   ❌ Tentativa ${i + 1}: ${result.error || result.status} (${result.time}ms)`);
    }
    
    // Pequena pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const stats = calculateStats(results);
  if (stats) {
    console.log(`\n📊 Resultados de ${apiName}:`);
    console.log(`   ⏱️  Tempo médio: ${stats.avg}ms`);
    console.log(`   🏃 Tempo mínimo: ${stats.min}ms`);
    console.log(`   🐌 Tempo máximo: ${stats.max}ms`);
    console.log(`   ✅ Taxa de sucesso: ${stats.successRate}%`);
    console.log(`   📈 Requisições: ${stats.total} sucessos, ${stats.failed} falhas`);
  } else {
    console.log(`\n❌ ${apiName}: Todas as requisições falharam`);
  }
  
  return stats;
}

// Teste de carga (múltiplas requisições simultâneas)
async function testLoad(apiName, url, options = {}) {
  console.log(`\n🔥 Teste de carga: ${apiName}`);
  
  const start = Date.now();
  const promises = Array.from({ length: CONCURRENT_REQUESTS }, () => 
    measureResponseTime(url, options)
  );
  
  const results = await Promise.all(promises);
  const end = Date.now();
  const totalTime = end - start;
  
  const stats = calculateStats(results);
  if (stats) {
    console.log(`   ⏱️  Tempo total: ${totalTime}ms`);
    console.log(`   📊 Tempo médio por requisição: ${Math.round(totalTime / CONCURRENT_REQUESTS)}ms`);
    console.log(`   🚀 Throughput: ${Math.round((CONCURRENT_REQUESTS / totalTime) * 1000)} req/s`);
    console.log(`   ✅ Taxa de sucesso: ${stats.successRate}%`);
  }
  
  return stats;
}

// Função principal de teste
async function runPerformanceTests() {
  console.log('🚀 Iniciando testes de performance das APIs...\n');
  
  const tests = [
    {
      name: 'Init Data Simple API',
      url: `${BASE_URL}/api/init-data-simple?user_id=edilsonmatos`
    },
    {
      name: 'Spread History API (BTC_USDT)',
      url: `${BASE_URL}/api/spread-history/24h/BTC_USDT`
    },
    {
      name: 'Price Comparison API (BTC_USDT)',
      url: `${BASE_URL}/api/price-comparison/BTC_USDT`
    },
    {
      name: 'Inter Exchange API',
      url: `${BASE_URL}/api/arbitrage/inter-exchange`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          spotExchange: 'gateio',
          futuresExchange: 'mexc',
          direction: 'ALL'
        })
      }
    }
  ];
  
  const results = {};
  
  // Testes individuais
  for (const test of tests) {
    const stats = await testAPI(test.name, test.url, test.options);
    results[test.name] = stats;
  }
  
  // Testes de carga
  console.log('\n🔥 Testes de carga (múltiplas requisições simultâneas):');
  for (const test of tests) {
    const loadStats = await testLoad(test.name, test.url, test.options);
    if (loadStats) {
      results[`${test.name} (Load)`] = loadStats;
    }
  }
  
  // Resumo geral
  console.log('\n📋 Resumo Geral dos Testes:');
  console.log('=' .repeat(50));
  
  const successfulTests = Object.entries(results).filter(([name, stats]) => stats && stats.successRate > 0);
  
  if (successfulTests.length > 0) {
    const avgResponseTime = successfulTests.reduce((sum, [name, stats]) => sum + stats.avg, 0) / successfulTests.length;
    const avgSuccessRate = successfulTests.reduce((sum, [name, stats]) => sum + stats.successRate, 0) / successfulTests.length;
    
    console.log(`   📊 Média de tempo de resposta: ${Math.round(avgResponseTime)}ms`);
    console.log(`   ✅ Taxa de sucesso média: ${Math.round(avgSuccessRate)}%`);
    console.log(`   🧪 Total de testes: ${Object.keys(results).length}`);
    console.log(`   ✅ Testes bem-sucedidos: ${successfulTests.length}`);
    
    // Análise de performance
    console.log('\n🎯 Análise de Performance:');
    if (avgResponseTime < 200) {
      console.log('   🚀 EXCELENTE: Performance muito boa (< 200ms)');
    } else if (avgResponseTime < 500) {
      console.log('   ✅ BOA: Performance aceitável (200-500ms)');
    } else if (avgResponseTime < 1000) {
      console.log('   ⚠️  REGULAR: Performance pode ser melhorada (500-1000ms)');
    } else {
      console.log('   ❌ RUIM: Performance precisa de otimização (> 1000ms)');
    }
    
    if (avgSuccessRate > 95) {
      console.log('   🎯 Estabilidade: Muito alta (> 95%)');
    } else if (avgSuccessRate > 80) {
      console.log('   ✅ Estabilidade: Boa (80-95%)');
    } else {
      console.log('   ⚠️  Estabilidade: Precisa melhorar (< 80%)');
    }
    
  } else {
    console.log('   ❌ Nenhum teste foi bem-sucedido');
  }
  
  // Detalhes por API
  console.log('\n📊 Detalhes por API:');
  console.log('=' .repeat(50));
  
  Object.entries(results).forEach(([name, stats]) => {
    if (stats && stats.successRate > 0) {
      const performance = stats.avg < 200 ? '🚀' : stats.avg < 500 ? '✅' : stats.avg < 1000 ? '⚠️' : '❌';
      console.log(`${performance} ${name}: ${stats.avg}ms (${stats.successRate}% sucesso)`);
    } else {
      console.log(`❌ ${name}: Falhou`);
    }
  });
  
  console.log('\n🎉 Testes de performance concluídos!');
}

// Executar testes
runPerformanceTests().catch(console.error); 