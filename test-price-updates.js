const WebSocket = require('ws');

console.log('🔌 Testando mensagens de price-update na porta 10000...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado com sucesso ao WebSocket!');
  console.log('📊 Monitorando mensagens de price-update...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update') {
      console.log('💰 PRICE UPDATE RECEBIDO:');
      console.log(`   Símbolo: ${message.symbol}`);
      console.log(`   Market Type: ${message.marketType}`);
      console.log(`   Best Ask: ${message.bestAsk}`);
      console.log(`   Best Bid: ${message.bestBid}`);
      console.log(`   Timestamp: ${new Date(message.timestamp).toLocaleTimeString()}`);
      console.log('');
    } else if (message.type === 'connection') {
      console.log('✅ Conectado ao servidor:', message.message);
    } else if (message.type === 'heartbeat') {
      console.log('💓 Heartbeat:', message.message);
    } else {
      // Não exibir mensagens de arbitragem para focar nos price-updates
      // console.log('📨 Outra mensagem:', message.type);
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
  ws.close();
  process.exit(0);
}, 30000); 