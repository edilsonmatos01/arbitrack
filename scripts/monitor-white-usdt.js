// Script para monitorar especificamente WHITE_USDT
const WebSocket = require('ws');

console.log('🔍 Monitorando especificamente WHITE_USDT...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let whiteUsdtCount = 0;
let lastWhiteUsdtTime = null;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket server');
  console.log('🔍 Procurando por dados de WHITE_USDT...\n');
});

ws.on('message', (data) => {
  messageCount++;
  
  try {
    const message = JSON.parse(data.toString());
    
    // Verificar se é uma atualização de preço
    if (message.type === 'price-update') {
      if (message.symbol === 'WHITE_USDT') {
        whiteUsdtCount++;
        lastWhiteUsdtTime = new Date().toLocaleTimeString();
        
        console.log(`🎯 WHITE_USDT #${whiteUsdtCount} - ${lastWhiteUsdtTime}`);
        console.log(`   📊 ${message.marketType}: Ask: ${message.ask}, Bid: ${message.bid}`);
        console.log(`   📈 Spread: ${((message.ask - message.bid) / message.bid * 100).toFixed(4)}%`);
        console.log('');
      }
    }
    
    // Verificar se é uma oportunidade de arbitragem
    if (message.type === 'arbitrage' && message.baseSymbol === 'WHITE_USDT') {
      console.log(`🚀 OPORTUNIDADE WHITE_USDT ENCONTRADA!`);
      console.log(`   💰 Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   📈 Buy: ${message.buyAt.exchange} ${message.buyAt.marketType} ${message.buyAt.price}`);
      console.log(`   📉 Sell: ${message.sellAt.exchange} ${message.sellAt.marketType} ${message.sellAt.price}`);
      console.log('');
    }
    
    // Mostrar estatísticas a cada 100 mensagens
    if (messageCount % 100 === 0) {
      console.log(`📊 Estatísticas: ${messageCount} mensagens, ${whiteUsdtCount} WHITE_USDT`);
      if (lastWhiteUsdtTime) {
        console.log(`   ⏰ Última WHITE_USDT: ${lastWhiteUsdtTime}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('close', () => {
  console.log('\n🔌 Conexão fechada');
  console.log(`📊 Resumo final: ${messageCount} mensagens, ${whiteUsdtCount} WHITE_USDT`);
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

// Timeout após 30 segundos
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
}, 30000); 