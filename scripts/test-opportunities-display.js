const WebSocket = require('ws');

console.log('🔍 Testando recepção de oportunidades...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      console.log(`💰 Arbitragem recebida: ${message.baseSymbol} - ${message.profitPercentage}%`);
      console.log(`   📈 Buy: ${message.buyAt.exchange} ${message.buyAt.marketType} ${message.buyAt.price}`);
      console.log(`   📉 Sell: ${message.sellAt.exchange} ${message.sellAt.marketType} ${message.sellAt.price}`);
      console.log(`   🎯 Type: ${message.arbitrageType}`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro de WebSocket:', error);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
});

// Timeout após 10 segundos
setTimeout(() => {
  console.log('⏰ Timeout - Fechando conexão');
  ws.close();
}, 10000); 