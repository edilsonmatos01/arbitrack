const fetch = require('node-fetch');

async function testDashboard() {
  console.log('📊 Testando dados do dashboard...');
  
  const baseUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  
  try {
    // Buscar dados em paralelo
    const [operationsRes, configsRes] = await Promise.all([
      fetch(`${baseUrl}/api/operation-history?filter=all`),
      fetch(`${baseUrl}/api/config/api-keys`)
    ]);
    
    const operations = await operationsRes.json();
    const configs = await configsRes.json();
    
    console.log('✅ Dados carregados com sucesso!');
    console.log('');
    
    // Calcular métricas
    const totalOperations = operations.length;
    const activeExchanges = configs.filter(config => config.isActive).length;
    
    if (totalOperations > 0) {
      const averageSpread = operations.reduce((sum, op) => sum + Math.abs(op.profitLossPercent), 0) / totalOperations;
      const successfulOperations = operations.filter(op => op.profitLossUsd > 0).length;
      const successRate = (successfulOperations / totalOperations) * 100;
      
      const totalTime = operations.reduce((sum, op) => {
        const created = new Date(op.createdAt).getTime();
        const finalized = new Date(op.finalizedAt).getTime();
        return sum + (finalized - created);
      }, 0);
      const averageTime = totalTime / totalOperations / (1000 * 60);
      
      console.log('📈 MÉTRICAS CALCULADAS:');
      console.log(`• Operações Realizadas: ${totalOperations}`);
      console.log(`• Spread Médio: ${averageSpread.toFixed(2)}%`);
      console.log(`• Taxa de Sucesso: ${successRate.toFixed(1)}%`);
      console.log(`• Exchanges Ativas: ${activeExchanges}`);
      console.log(`• Tempo Médio: ${averageTime.toFixed(1)}min`);
      console.log('');
      
      console.log('📋 DETALHES DA OPERAÇÃO:');
      operations.forEach((op, index) => {
        console.log(`${index + 1}. ${op.symbol}`);
        console.log(`   Lucro: $${op.profitLossUsd.toFixed(2)} (${op.profitLossPercent.toFixed(2)}%)`);
        console.log(`   Exchanges: ${op.spotExchange} → ${op.futuresExchange}`);
        console.log(`   Data: ${new Date(op.finalizedAt).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('📈 MÉTRICAS (sem operações):');
      console.log(`• Operações Realizadas: 0`);
      console.log(`• Spread Médio: 0.00%`);
      console.log(`• Taxa de Sucesso: 0.0%`);
      console.log(`• Exchanges Ativas: ${activeExchanges}`);
      console.log(`• Tempo Médio: 0.0min`);
    }
    
    console.log('🔧 EXCHANGES CONFIGURADAS:');
    configs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.exchange} - ${config.isActive ? '✅ Ativa' : '❌ Inativa'}`);
    });
    
    console.log('');
    console.log('✅ Dashboard deve estar funcionando corretamente!');
    console.log('🌐 Acesse: https://robo-de-arbitragem-5n8k.onrender.com/dashboard');
    
  } catch (error) {
    console.error('❌ Erro ao testar dashboard:', error.message);
  }
}

testDashboard().catch(console.error); 