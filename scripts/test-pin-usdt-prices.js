const WebSocket = require('ws');

console.log('🔌 Testando preços PIN_USDT no WebSocket...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  console.log('📊 Aguardando mensagens de preço para PIN_USDT...');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update' && message.symbol === 'PIN_USDT') {
      console.log(`📈 PIN_USDT ${message.marketType.toUpperCase()}:`);
      console.log(`   Ask: ${message.bestAsk}, Bid: ${message.bestBid}`);
      console.log(`   Timestamp: ${new Date(message.timestamp).toLocaleTimeString()}`);
      console.log('---');
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão WebSocket:', error);
});

ws.on('close', () => {
  console.log('🔌 Conexão WebSocket fechada');
});

// Manter o script rodando por 20 segundos
setTimeout(() => {
  console.log('⏰ Teste concluído. Fechando conexão...');
  ws.close();
  process.exit(0);
}, 20000); 