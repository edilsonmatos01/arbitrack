const WebSocket = require('ws');

console.log('🔍 Conectando ao worker para verificar dados...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao worker!');
  console.log('📊 Aguardando dados de preços...');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      console.log('\n🎯 OPORTUNIDADE ENCONTRADA:');
      console.log(`   Símbolo: ${message.baseSymbol}`);
      console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   Compra: ${message.buyAt.exchange} ${message.buyAt.marketType} - $${message.buyAt.price}`);
      console.log(`   Venda: ${message.sellAt.exchange} ${message.sellAt.marketType} - $${message.sellAt.price}`);
      console.log(`   Timestamp: ${new Date(message.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    } else if (message.type === 'heartbeat') {
      console.log(`💓 Heartbeat: ${message.message}`);
    } else {
      console.log('📨 Mensagem recebida:', message);
    }
  } catch (error) {
    console.log('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
});

// Manter conexão aberta por 30 segundos
setTimeout(() => {
  console.log('\n⏰ Encerrando verificação após 30 segundos...');
  ws.close();
  process.exit(0);
}, 30000); 