// Script para debugar o filtro do frontend
const WebSocket = require('ws');

console.log('🔍 Debugando filtro do frontend para WHITE_USDT...');

const ws = new WebSocket('ws://localhost:10000');

let opportunities = [];

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket server');
  console.log('🔍 Monitorando oportunidades de arbitragem...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      opportunities.push(message);
      
      console.log(`🚀 Oportunidade recebida:`);
      console.log(`   📊 Symbol: ${message.baseSymbol}`);
      console.log(`   💰 Spread: ${message.profitPercentage}%`);
      console.log(`   📈 Buy: ${message.buyAt.exchange} ${message.buyAt.marketType} ${message.buyAt.price}`);
      console.log(`   📉 Sell: ${message.sellAt.exchange} ${message.sellAt.marketType} ${message.sellAt.price}`);
      console.log(`   🎯 Arbitrage Type: ${message.arbitrageType}`);
      
      // Simular filtro do frontend
      const minSpread = 0.001; // 0.001%
      
      // Verificar se tem preços válidos
      const hasValidPrices = message.buyAt.price && message.sellAt.price && 
                            message.buyAt.price > 0 && message.sellAt.price > 0;
      
      // Verificar se é spot-to-futures
      const isSpotBuyFuturesSell = message.buyAt.marketType === 'spot' && 
                                   message.sellAt.marketType === 'futures';
      
      // Verificar spread mínimo
      const meetsMinSpread = message.profitPercentage >= minSpread;
      
      console.log(`\n🔍 Análise do filtro:`);
      console.log(`   ✅ Preços válidos: ${hasValidPrices}`);
      console.log(`   ✅ Spot→Futures: ${isSpotBuyFuturesSell}`);
      console.log(`   ✅ Spread ≥ ${minSpread}%: ${meetsMinSpread}`);
      
      const shouldDisplay = hasValidPrices && isSpotBuyFuturesSell && meetsMinSpread;
      console.log(`   🎯 Deve aparecer na tabela: ${shouldDisplay ? '✅ SIM' : '❌ NÃO'}`);
      
      if (!shouldDisplay) {
        console.log(`   ❌ Motivo da rejeição:`);
        if (!hasValidPrices) console.log(`      - Preços inválidos`);
        if (!isSpotBuyFuturesSell) console.log(`      - Não é spot→futures`);
        if (!meetsMinSpread) console.log(`      - Spread muito baixo`);
      }
      
      console.log('');
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('close', () => {
  console.log('\n🔌 Conexão fechada');
  console.log(`📊 Total de oportunidades recebidas: ${opportunities.length}`);
  
  // Mostrar resumo
  const whiteOpportunities = opportunities.filter(opp => opp.baseSymbol === 'WHITE_USDT');
  console.log(`📊 Oportunidades WHITE_USDT: ${whiteOpportunities.length}`);
  
  if (whiteOpportunities.length > 0) {
    console.log('\n📋 Detalhes das oportunidades WHITE_USDT:');
    whiteOpportunities.forEach((opp, index) => {
      console.log(`   ${index + 1}. Spread: ${opp.profitPercentage}%, Buy: ${opp.buyAt.exchange} ${opp.buyAt.marketType}, Sell: ${opp.sellAt.exchange} ${opp.sellAt.marketType}`);
    });
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

// Timeout após 30 segundos
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
}, 30000); 