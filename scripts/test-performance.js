const fetch = require('node-fetch');

async function testPagePerformance() {
  console.log('=== TESTE DE PERFORMANCE DAS PÁGINAS ===');
  
  const baseURL = 'http://localhost:10000';
  const pages = [
    '/',
    '/dashboard',
    '/arbitragem',
    '/big-arb',
    '/carteiras',
    '/historico',
    '/configuracoes'
  ];
  
  for (const page of pages) {
    console.log(`\n📄 Testando: ${page}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${baseURL}${page}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000 // 30 segundos
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Tempo de resposta: ${duration}ms`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        console.log(`📏 Tamanho: ${contentLength ? contentLength + ' bytes' : 'Desconhecido'}`);
        
        if (duration > 5000) {
          console.log('⚠️  Página lenta (>5s)');
        } else if (duration > 2000) {
          console.log('⚠️  Página moderadamente lenta (>2s)');
        } else {
          console.log('✅ Página carregando normalmente');
        }
      } else {
        console.log('❌ Erro na página');
      }
      
    } catch (error) {
      console.error('💥 Erro ao testar página:', error.message);
    }
  }
}

async function testAPIEndpoints() {
  console.log('\n=== TESTE DE PERFORMANCE DAS APIs ===');
  
  const baseURL = 'http://localhost:10000';
  const apis = [
    '/api/health',
    '/api/positions',
    '/api/spreads/max',
    '/api/average-spread',
    '/api/spread-history/24h/BTC_USDT',
    '/api/price-comparison/BTC_USDT'
  ];
  
  for (const api of apis) {
    console.log(`\n🔌 Testando: ${api}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${baseURL}${api}`, {
        method: 'GET',
        timeout: 10000 // 10 segundos
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Tempo de resposta: ${duration}ms`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        if (duration > 3000) {
          console.log('⚠️  API lenta (>3s)');
        } else if (duration > 1000) {
          console.log('⚠️  API moderadamente lenta (>1s)');
        } else {
          console.log('✅ API respondendo rapidamente');
        }
      } else {
        console.log('❌ API com erro');
      }
      
    } catch (error) {
      console.error('💥 Erro ao testar API:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando testes de performance...\n');
  
  await testPagePerformance();
  await testAPIEndpoints();
  
  console.log('\n=== RECOMENDAÇÕES ===');
  console.log('1. Se páginas estão lentas, verifique os componentes React');
  console.log('2. Se APIs estão lentas, verifique consultas ao banco');
  console.log('3. Considere implementar cache para dados estáticos');
  console.log('4. Verifique se há loops infinitos nos componentes');
}

main().catch(console.error); 