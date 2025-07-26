const WebSocket = require('ws');

console.log('🔌 Testando conexões do worker...');

// Testar Gate.io Spot
console.log('\n📊 Testando Gate.io Spot...');
const gateioWs = new WebSocket('wss://api.gateio.ws/ws/v4/');

gateioWs.on('open', () => {
  console.log('✅ Gate.io Spot conectado!');
  
  // Inscrever no CBK_USDT
  const subscribeMsg = {
    "time": Math.floor(Date.now() / 1000),
    "channel": "spot.tickers",
    "event": "subscribe",
    "payload": ["CBK_USDT"]
  };
  
  gateioWs.send(JSON.stringify(subscribeMsg));
  console.log('📨 Inscrição enviada para CBK_USDT');
});

gateioWs.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Gate.io:', message);
  } catch (error) {
    console.log('❌ Erro Gate.io:', error.message);
  }
});

gateioWs.on('error', (error) => {
  console.error('❌ Erro Gate.io:', error.message);
});

// Testar MEXC Futures
console.log('\n📊 Testando MEXC Futures...');
const mexcWs = new WebSocket('wss://contract.mexc.com/ws');

mexcWs.on('open', () => {
  console.log('✅ MEXC Futures conectado!');
  
  // Inscrever no CBKUSDT
  const subscribeMsg = {
    "method": "sub.ticker",
    "param": { "symbol": "CBKUSDT" }
  };
  
  mexcWs.send(JSON.stringify(subscribeMsg));
  console.log('📨 Inscrição enviada para CBKUSDT');
});

mexcWs.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 MEXC:', message);
  } catch (error) {
    console.log('❌ Erro MEXC:', error.message);
  }
});

mexcWs.on('error', (error) => {
  console.error('❌ Erro MEXC:', error.message);
});

// Fechar após 10 segundos
setTimeout(() => {
  console.log('\n⏰ Fechando conexões...');
  gateioWs.close();
  mexcWs.close();
  process.exit(0);
}, 10000); 