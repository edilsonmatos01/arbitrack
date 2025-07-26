// Script para debugar especificamente WHITE_USDT no worker
const WebSocket = require('ws');

console.log('🔍 Debugando especificamente WHITE_USDT no worker...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let whiteUsdtCount = 0;
let arbitrageCount = 0;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket server');
  console.log('🔍 Monitorando especificamente WHITE_USDT...\n');
});

ws.on('message', (data) => {
  messageCount++;
  
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      arbitrageCount++;
      
      if (message.baseSymbol === 'WHITE_USDT') {
        whiteUsdtCount++;
        console.log(`🎯 WHITE_USDT #${whiteUsdtCount} encontrada!`);
        console.log(`   📊 Spread: ${message.profitPercentage}%`);
        console.log(`   📈 Buy: ${message.buyAt.exchange} ${message.buyAt.marketType} ${message.buyAt.price}`);
        console.log(`   📉 Sell: ${message.sellAt.exchange} ${message.sellAt.marketType} ${message.sellAt.price}`);
        console.log(`   🎯 Arbitrage Type: ${message.arbitrageType}`);
        console.log(`   ⏰ Timestamp: ${new Date(message.timestamp).toLocaleTimeString()}`);
        console.log('');
      }
    }
    
    // Mostrar estatísticas a cada 100 mensagens
    if (messageCount % 100 === 0) {
      console.log(`📊 Estatísticas: ${messageCount} mensagens, ${arbitrageCount} arbitragem, ${whiteUsdtCount} WHITE_USDT`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('close', () => {
  console.log('\n🔌 Conexão fechada');
  console.log(`📊 Resumo final:`);
  console.log(`   Total de mensagens: ${messageCount}`);
  console.log(`   Oportunidades de arbitragem: ${arbitrageCount}`);
  console.log(`   WHITE_USDT encontradas: ${whiteUsdtCount}`);
  
  if (whiteUsdtCount === 0) {
    console.log('❌ NENHUMA WHITE_USDT foi encontrada!');
  } else {
    console.log('✅ WHITE_USDT está sendo processada corretamente!');
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

// Timeout após 60 segundos
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
}, 60000); 