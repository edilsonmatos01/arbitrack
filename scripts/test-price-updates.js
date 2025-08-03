const WebSocket = require('ws');

console.log('🔌 Conectando ao WebSocket na porta 10000...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  console.log('📊 Aguardando mensagens de preço...');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update') {
      console.log(`📈 PREÇO ATUALIZADO: ${message.symbol} ${message.marketType}`);
      console.log(`   Ask: ${message.bestAsk}, Bid: ${message.bestBid}`);
      console.log(`   Timestamp: ${new Date(message.timestamp).toLocaleTimeString()}`);
      console.log('---');
    } else if (message.type === 'arbitrage') {
      console.log(`💰 OPORTUNIDADE: ${message.baseSymbol} - Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   Spot: ${message.buyAt.price}, Futures: ${message.sellAt.price}`);
      console.log('---');
    } else if (message.type === 'connection') {
      console.log(`🔗 ${message.message}`);
    } else {
      console.log(`📨 Mensagem recebida:`, message);
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

// Manter o script rodando por 30 segundos
setTimeout(() => {
  console.log('⏰ Teste concluído. Fechando conexão...');
  ws.close();
  process.exit(0);
}, 30000); 