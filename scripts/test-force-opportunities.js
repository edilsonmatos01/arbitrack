const WebSocket = require('ws');

console.log('🧪 TESTE - FORÇANDO OPORTUNIDADES DE ARBITRAGEM');
console.log('===============================================');

// Simular dados de preços que gerariam oportunidades
const testData = {
  'BTC_USDT': {
    gateio_spot: { bestAsk: 118000, bestBid: 117999 },
    mexc_futures: { bestAsk: 118200, bestBid: 118199 }
  },
  'ETH_USDT': {
    gateio_spot: { bestAsk: 3200, bestBid: 3199 },
    mexc_futures: { bestAsk: 3220, bestBid: 3219 }
  },
  'SOL_USDT': {
    gateio_spot: { bestAsk: 150, bestBid: 149 },
    mexc_futures: { bestAsk: 152, bestBid: 151 }
  }
};

console.log('📊 DADOS DE TESTE:');
Object.keys(testData).forEach(symbol => {
  const data = testData[symbol];
  const spotPrice = data.gateio_spot.bestAsk;
  const futuresPrice = data.mexc_futures.bestBid;
  const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
  
  console.log(`${symbol}:`);
  console.log(`  Gate.io Spot: $${spotPrice} (compra)`);
  console.log(`  MEXC Futures: $${futuresPrice} (venda)`);
  console.log(`  Spread: ${spread.toFixed(4)}%`);
  console.log(`  É oportunidade: ${spread >= 0.01 ? '✅ SIM' : '❌ NÃO'}`);
  console.log('');
});

// Conectar ao worker e enviar dados de teste
const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao worker!');
  console.log('📤 Enviando dados de teste...');
  
  // Enviar dados de teste
  const testMessage = {
    type: 'test_data',
    data: testData
  };
  
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      console.log(`\n🎯 OPORTUNIDADE RECEBIDA:`);
      console.log(`   Símbolo: ${message.baseSymbol}`);
      console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   Compra: ${message.buyAt.exchange} @ $${message.buyAt.price}`);
      console.log(`   Venda: ${message.sellAt.exchange} @ $${message.sellAt.price}`);
    } else if (message.type === 'heartbeat') {
      console.log(`💓 ${message.message}`);
    } else {
      console.log(`📨 Mensagem: ${message.type}`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro no WebSocket:', error.message);
});

// Aguardar 60 segundos
setTimeout(() => {
  console.log('\n⏰ Teste concluído');
  ws.close();
}, 60000); 