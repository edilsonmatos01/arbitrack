const WebSocket = require('ws');

console.log('🔌 Testando sistema de cache de posições...');

const ws = new WebSocket('ws://localhost:10000');

let aceData = null;
let cpoolData = null;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  console.log('📊 Monitorando dados para ACE e CPOOL...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      if (message.baseSymbol === 'ACE') {
        aceData = message;
        console.log('💰 ACE atualizado:');
        console.log(`   Spot: ${message.buyAt.price} (${message.buyAt.marketType})`);
        console.log(`   Futures: ${message.sellAt.price} (${message.sellAt.marketType})`);
        console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
        console.log('');
      } else if (message.baseSymbol === 'CPOOL') {
        cpoolData = message;
        console.log('💰 CPOOL atualizado:');
        console.log(`   Spot: ${message.buyAt.price} (${message.buyAt.marketType})`);
        console.log(`   Futures: ${message.sellAt.price} (${message.sellAt.marketType})`);
        console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
        console.log('');
      }
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

// Fechar após 60 segundos
setTimeout(() => {
  console.log('⏰ Fechando conexão de teste...');
  console.log('\n📊 Resumo dos dados coletados:');
  if (aceData) {
    console.log('ACE:', aceData);
  } else {
    console.log('❌ Nenhum dado recebido para ACE');
  }
  if (cpoolData) {
    console.log('CPOOL:', cpoolData);
  } else {
    console.log('❌ Nenhum dado recebido para CPOOL');
  }
  ws.close();
  process.exit(0);
}, 60000); 