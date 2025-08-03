const WebSocket = require('ws');

console.log('🔍 Testando WebSocket de oportunidades...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket server!');
  console.log('📡 Aguardando oportunidades...');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Mensagem recebida:', message);
    
    if (message.type === 'arbitrage') {
      console.log('💰 OPORTUNIDADE DETECTADA:');
      console.log('  - Símbolo:', message.baseSymbol);
      console.log('  - Spread:', message.profitPercentage + '%');
      console.log('  - Compra:', message.buyAt.exchange, 'Spot:', message.buyAt.price);
      console.log('  - Venda:', message.sellAt.exchange, 'Futures:', message.sellAt.price);
      console.log('  - Tipo:', message.arbitrageType);
      console.log('  - Timestamp:', new Date(message.timestamp).toLocaleString());
      console.log('---');
    } else if (message.type === 'connection') {
      console.log('🔗 Mensagem de conexão:', message.message);
    } else {
      console.log('❓ Tipo de mensagem desconhecido:', message.type);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro no WebSocket:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
});

// Aguardar 30 segundos e depois fechar
setTimeout(() => {
  console.log('⏰ Teste concluído. Fechando conexão...');
  ws.close();
  process.exit(0);
}, 30000); 