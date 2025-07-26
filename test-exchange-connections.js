const WebSocket = require('ws');

console.log('🔌 Testando conexões com as exchanges...\n');

// Teste Gate.io Spot
console.log('📊 Testando Gate.io Spot...');
const gateioWs = new WebSocket('wss://api.gateio.ws/ws/v4/');

gateioWs.on('open', () => {
  console.log('✅ Gate.io Spot conectado!');
  
  // Subscrever a alguns símbolos
  const symbols = ['BTC_USDT', 'ETH_USDT', 'CPOOL_USDT'];
  symbols.forEach((symbol) => {
    const msg = {
      id: Date.now(),
      time: Date.now(),
      channel: 'spot.tickers',
      event: 'subscribe',
      payload: [symbol],
    };
    gateioWs.send(JSON.stringify(msg));
    console.log(`📡 Subscrito a ${symbol}`);
  });
});

gateioWs.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.channel === 'spot.tickers' && msg.result) {
      console.log('💰 Gate.io Spot - Dados recebidos:');
      console.log(`   Símbolo: ${msg.result.currency_pair}`);
      console.log(`   Ask: ${msg.result.lowest_ask}`);
      console.log(`   Bid: ${msg.result.highest_bid}`);
      console.log('');
    }
  } catch (e) {
    console.log('❌ Erro ao processar mensagem Gate.io:', e.message);
  }
});

gateioWs.on('error', (err) => {
  console.error('❌ Erro Gate.io Spot:', err.message);
});

// Teste MEXC Futures
console.log('📊 Testando MEXC Futures...');
const mexcWs = new WebSocket('wss://contract.mexc.com/ws');

mexcWs.on('open', () => {
  console.log('✅ MEXC Futures conectado!');
  
  // Subscrever a alguns símbolos
  const symbols = ['BTC_USDT', 'ETH_USDT', 'CPOOL_USDT'];
  symbols.forEach((symbol) => {
    const msg = {
      method: 'sub.ticker',
      param: { symbol },
    };
    mexcWs.send(JSON.stringify(msg));
    console.log(`📡 Subscrito a ${symbol}`);
  });
});

mexcWs.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.channel === 'push.ticker' && msg.data && msg.symbol) {
      console.log('💰 MEXC Futures - Dados recebidos:');
      console.log(`   Símbolo: ${msg.symbol}`);
      console.log(`   Ask: ${msg.data.ask1}`);
      console.log(`   Bid: ${msg.data.bid1}`);
      console.log('');
    }
  } catch (e) {
    console.log('❌ Erro ao processar mensagem MEXC:', e.message);
  }
});

mexcWs.on('error', (err) => {
  console.error('❌ Erro MEXC Futures:', err.message);
});

// Fechar após 30 segundos
setTimeout(() => {
  console.log('⏰ Fechando conexões de teste...');
  gateioWs.close();
  mexcWs.close();
  process.exit(0);
}, 30000); 