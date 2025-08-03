const WebSocket = require('ws');

console.log('🔍 DEBUG - FRONTEND OPORTUNIDADES');
console.log('=================================');

// Simular exatamente o que o frontend faz
const ws = new WebSocket('ws://localhost:10000');

let opportunities = [];
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      opportunities.push(message);
      console.log(`\n🎯 OPORTUNIDADE #${opportunities.length}:`);
      console.log(`   Símbolo: ${message.baseSymbol}`);
      console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   Compra: ${message.buyAt.exchange} @ $${message.buyAt.price}`);
      console.log(`   Venda: ${message.sellAt.exchange} @ $${message.sellAt.price}`);
      console.log(`   Tipo: ${message.arbitrageType}`);
      
      // Simular o processamento do frontend
      console.log('\n🔍 ANÁLISE DO FRONTEND:');
      
      // 1. Verificar se tem estrutura básica
      const hasBuyAt = !!message.buyAt;
      const hasSellAt = !!message.sellAt;
      console.log(`   ✅ buyAt: ${hasBuyAt}`);
      console.log(`   ✅ sellAt: ${hasSellAt}`);
      
      // 2. Verificar preços
      const buyPrice = message.buyAt?.price;
      const sellPrice = message.sellAt?.price;
      const hasValidPrices = buyPrice > 0 && sellPrice > 0;
      console.log(`   ✅ Preços válidos: ${hasValidPrices} (${buyPrice} / ${sellPrice})`);
      
      // 3. Verificar tipos de mercado
      const isSpotBuyFuturesSell = message.buyAt?.marketType === 'spot' && message.sellAt?.marketType === 'futures';
      console.log(`   ✅ Spot→Futures: ${isSpotBuyFuturesSell}`);
      
      // 4. Calcular spread
      const spread = ((sellPrice - buyPrice) / buyPrice) * 100;
      console.log(`   ✅ Spread calculado: ${spread.toFixed(4)}%`);
      
      // 5. Verificar se seria aceita
      const isValid = isSpotBuyFuturesSell && spread > 0;
      console.log(`   ✅ Seria aceita: ${isValid}`);
      
      if (isValid) {
        console.log('   🎉 OPORTUNIDADE VÁLIDA - Deveria aparecer na tabela!');
      } else {
        console.log('   ❌ OPORTUNIDADE REJEITADA - Não aparecerá na tabela');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro no WebSocket:', error.message);
});

ws.on('close', () => {
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n🔌 WebSocket fechado após ${duration.toFixed(1)}s`);
  console.log(`📊 Total de oportunidades recebidas: ${opportunities.length}`);
  
  if (opportunities.length > 0) {
    console.log('\n📋 RESUMO DAS OPORTUNIDADES:');
    opportunities.forEach((opp, index) => {
      const spread = ((opp.sellAt.price - opp.buyAt.price) / opp.buyAt.price) * 100;
      const isValid = opp.buyAt.marketType === 'spot' && opp.sellAt.marketType === 'futures' && spread > 0;
      console.log(`   ${index + 1}. ${opp.baseSymbol}: ${spread.toFixed(4)}% - ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    });
  }
});

// Aguardar 20 segundos
setTimeout(() => {
  console.log('\n⏰ Tempo limite atingido (20s)');
  ws.close();
}, 20000); 