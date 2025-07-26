const WebSocket = require('ws');

console.log('🔌 Testando conexão WebSocket...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let priceUpdateCount = 0;
let arbitrageCount = 0;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  
  // Enviar mensagem de identificação
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'test-client',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    messageCount++;
    
    console.log(`📨 Mensagem ${messageCount}:`, {
      type: message.type,
      symbol: message.symbol || message.baseSymbol,
      timestamp: new Date(message.timestamp).toLocaleTimeString()
    });
    
    if (message.type === 'price-update') {
      priceUpdateCount++;
      console.log(`💰 Price Update ${priceUpdateCount}: ${message.symbol} ${message.marketType} - Ask: ${message.bestAsk}, Bid: ${message.bestBid}`);
    } else if (message.type === 'arbitrage') {
      arbitrageCount++;
      console.log(`📈 Arbitrage ${arbitrageCount}: ${message.baseSymbol} - Spread: ${message.profitPercentage}%`);
    } else if (message.type === 'connection') {
      console.log('✅ Mensagem de conexão recebida:', message.message);
    } else if (message.type === 'heartbeat') {
      console.log('💓 Heartbeat recebido');
    }
    
    // Mostrar estatísticas a cada 10 mensagens
    if (messageCount % 10 === 0) {
      console.log(`\n📊 Estatísticas: ${messageCount} mensagens, ${priceUpdateCount} price-updates, ${arbitrageCount} arbitragens\n`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro WebSocket:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Conexão fechada: ${code} - ${reason}`);
  console.log(`📊 Total: ${messageCount} mensagens, ${priceUpdateCount} price-updates, ${arbitrageCount} arbitragens`);
});

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
  process.exit(0);
}, 30000); 