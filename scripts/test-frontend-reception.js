// Script para testar se o frontend está recebendo as mensagens do worker
const WebSocket = require('ws');

console.log('🔍 Testando recepção de mensagens pelo frontend...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let arbitrageCount = 0;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket server');
  console.log('🔍 Monitorando mensagens...\n');
});

ws.on('message', (data) => {
  messageCount++;
  
  try {
    const message = JSON.parse(data.toString());
    
    console.log(`📨 Mensagem #${messageCount}:`);
    console.log(`   Tipo: ${message.type}`);
    
    if (message.type === 'arbitrage') {
      arbitrageCount++;
      console.log(`   🎯 Oportunidade #${arbitrageCount}:`);
      console.log(`      Symbol: ${message.baseSymbol}`);
      console.log(`      Spread: ${message.profitPercentage}%`);
      console.log(`      Buy: ${message.buyAt.exchange} ${message.buyAt.marketType} ${message.buyAt.price}`);
      console.log(`      Sell: ${message.sellAt.exchange} ${message.sellAt.marketType} ${message.sellAt.price}`);
      console.log(`      Arbitrage Type: ${message.arbitrageType}`);
      
      // Verificar se é WHITE_USDT
      if (message.baseSymbol === 'WHITE_USDT') {
        console.log(`   🎉 WHITE_USDT ENCONTRADA!`);
        console.log(`      ✅ Deve aparecer no frontend`);
      }
    } else if (message.type === 'price-update') {
      console.log(`   💰 Price Update: ${message.symbol} ${message.marketType}`);
    } else if (message.type === 'heartbeat') {
      console.log(`   💓 Heartbeat: ${message.message}`);
    } else if (message.type === 'connection') {
      console.log(`   🔗 Connection: ${message.message}`);
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('close', () => {
  console.log('\n🔌 Conexão fechada');
  console.log(`📊 Resumo:`);
  console.log(`   Total de mensagens: ${messageCount}`);
  console.log(`   Oportunidades de arbitragem: ${arbitrageCount}`);
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

// Timeout após 30 segundos
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
}, 30000); 