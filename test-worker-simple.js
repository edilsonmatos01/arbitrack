const WebSocket = require('ws');

console.log('🔌 Testando worker simples...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  console.log('📊 Monitorando todas as mensagens...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    messageCount++;
    
    console.log(`📨 Mensagem #${messageCount}:`, message.type || 'unknown');
    
    if (message.type === 'arbitrage') {
      console.log(`   Símbolo: ${message.baseSymbol}`);
      console.log(`   Spread: ${message.profitPercentage?.toFixed(4)}%`);
      console.log(`   Spot: ${message.buyAt?.price} (${message.buyAt?.marketType})`);
      console.log(`   Futures: ${message.sellAt?.price} (${message.sellAt?.marketType})`);
      console.log('');
    } else if (message.type === 'price-update') {
      console.log(`   Símbolo: ${message.symbol}`);
      console.log(`   Mercado: ${message.marketType}`);
      console.log(`   Ask: ${message.bestAsk}, Bid: ${message.bestBid}`);
      console.log('');
    } else if (message.type === 'connection') {
      console.log(`   ${message.message}`);
      console.log('');
    }
  } catch (error) {
    console.log('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

ws.on('close', (code, reason) => {
  console.log('🔌 Conexão fechada:', code, reason?.toString());
});

// Fechar após 30 segundos
setTimeout(() => {
  console.log('⏰ Fechando conexão de teste...');
  console.log(`📊 Total de mensagens recebidas: ${messageCount}`);
  ws.close();
  process.exit(0);
}, 30000); 