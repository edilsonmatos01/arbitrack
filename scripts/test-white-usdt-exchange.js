// Script para testar se WHITE_USDT está disponível nas exchanges
const WebSocket = require('ws');

console.log('🔍 Testando disponibilidade de WHITE_USDT nas exchanges...\n');

// Testar Gate.io Spot
console.log('📊 Testando Gate.io Spot...');
const gateioWs = new WebSocket('wss://api.gateio.ws/ws/v4/');

gateioWs.on('open', () => {
  console.log('✅ Conectado ao Gate.io Spot');
  
  // Subscrever para WHITE_USDT
  const subscribeMsg = {
    "time": Math.floor(Date.now() / 1000),
    "channel": "spot.tickers",
    "event": "subscribe",
    "payload": ["WHITE_USDT"]
  };
  
  gateioWs.send(JSON.stringify(subscribeMsg));
  console.log('📤 Enviada subscrição para WHITE_USDT no Gate.io');
});

let gateioData = false;
gateioWs.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.event === 'subscribe' && message.status === 'success') {
      console.log('✅ Subscrição Gate.io Spot bem-sucedida');
    }
    
    if (message.channel === 'spot.tickers' && message.result && message.result.currency_pair === 'WHITE_USDT') {
      gateioData = true;
      console.log('🎯 WHITE_USDT Gate.io Spot:');
      console.log(`   💰 Ask: ${message.result.lowest_ask}`);
      console.log(`   💰 Bid: ${message.result.highest_bid}`);
      console.log(`   📊 Volume: ${message.result.quote_volume}`);
    }
  } catch (error) {
    // Ignorar erros de parsing
  }
});

// Testar MEXC Futures
console.log('\n📊 Testando MEXC Futures...');
const mexcWs = new WebSocket('wss://contract.mexc.com/edge');

mexcWs.on('open', () => {
  console.log('✅ Conectado ao MEXC Futures');
  
  // Subscrever para WHITE_USDT
  const subscribeMsg = {
    "method": "sub.ticker",
    "param": {
      "symbol": "WHITE_USDT"
    }
  };
  
  mexcWs.send(JSON.stringify(subscribeMsg));
  console.log('📤 Enviada subscrição para WHITE_USDT no MEXC');
});

let mexcData = false;
mexcWs.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.channel === 'sub.ticker' && message.data && message.data.symbol === 'WHITE_USDT') {
      mexcData = true;
      console.log('🎯 WHITE_USDT MEXC Futures:');
      console.log(`   💰 Ask: ${message.data.ask1}`);
      console.log(`   💰 Bid: ${message.data.bid1}`);
      console.log(`   📊 Volume: ${message.data.vol}`);
    }
  } catch (error) {
    // Ignorar erros de parsing
  }
});

// Timeout e resumo
setTimeout(() => {
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log(`   Gate.io Spot: ${gateioData ? '✅ Dados recebidos' : '❌ Sem dados'}`);
  console.log(`   MEXC Futures: ${mexcData ? '✅ Dados recebidos' : '❌ Sem dados'}`);
  
  if (gateioData && mexcData) {
    console.log('\n🎉 WHITE_USDT está disponível em ambas as exchanges!');
  } else if (gateioData || mexcData) {
    console.log('\n⚠️ WHITE_USDT está disponível em apenas uma exchange.');
  } else {
    console.log('\n❌ WHITE_USDT não está disponível nas exchanges testadas.');
  }
  
  gateioWs.close();
  mexcWs.close();
  process.exit(0);
}, 10000); 