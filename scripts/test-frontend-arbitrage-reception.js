// Script para testar especificamente se o frontend está recebendo mensagens de arbitragem
const WebSocket = require('ws');

console.log('🔍 Testando recepção de mensagens de arbitragem no frontend...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let arbitrageCount = 0;
let whiteUsdtArbitrageCount = 0;
let whiteUsdtPriceUpdateCount = 0;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket server');
  console.log('🔍 Monitorando mensagens de arbitragem...\n');
  
  // Enviar mensagem de identificação como o frontend faz
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'arbitrage-app',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  messageCount++;
  
  try {
    const message = JSON.parse(data.toString());
    
    // Log específico para WHITE_USDT
    if (message.baseSymbol === 'WHITE_USDT' || message.symbol === 'WHITE_USDT') {
      console.log(`🎯 WHITE_USDT #${messageCount}:`, message);
    }
    
    if (message.type === 'arbitrage') {
      arbitrageCount++;
      console.log(`📊 Arbitragem #${arbitrageCount}: ${message.baseSymbol} - ${message.profitPercentage}%`);
      
      if (message.baseSymbol === 'WHITE_USDT') {
        whiteUsdtArbitrageCount++;
        console.log(`🎯 WHITE_USDT ARBITRAGEM #${whiteUsdtArbitrageCount}:`);
        console.log(`   📊 Spread: ${message.profitPercentage}%`);
        console.log(`   📈 Buy: ${message.buyAt.exchange} ${message.buyAt.marketType} ${message.buyAt.price}`);
        console.log(`   📉 Sell: ${message.sellAt.exchange} ${message.sellAt.marketType} ${message.sellAt.price}`);
        console.log(`   🎯 Arbitrage Type: ${message.arbitrageType}`);
        console.log('');
      }
    }
    else if (message.type === 'price-update' && message.symbol === 'WHITE_USDT') {
      whiteUsdtPriceUpdateCount++;
      console.log(`💰 WHITE_USDT Price Update #${whiteUsdtPriceUpdateCount}: ${message.marketType} - Ask: ${message.bestAsk}, Bid: ${message.bestBid}`);
    }
    
    // Mostrar estatísticas a cada 50 mensagens
    if (messageCount % 50 === 0) {
      console.log(`📊 Estatísticas: ${messageCount} mensagens, ${arbitrageCount} arbitragem, ${whiteUsdtArbitrageCount} WHITE_USDT arbitragem, ${whiteUsdtPriceUpdateCount} WHITE_USDT price updates`);
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
  console.log(`   WHITE_USDT arbitragem: ${whiteUsdtArbitrageCount}`);
  console.log(`   WHITE_USDT price updates: ${whiteUsdtPriceUpdateCount}`);
  
  if (whiteUsdtArbitrageCount === 0) {
    console.log('❌ NENHUMA arbitragem de WHITE_USDT foi recebida!');
  } else {
    console.log('✅ Arbitragem de WHITE_USDT está sendo recebida corretamente!');
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

// Timeout após 30 segundos
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
}, 30000); 