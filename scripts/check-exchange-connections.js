const WebSocket = require('ws');

console.log('🔍 VERIFICANDO CONEXÕES DAS EXCHANGES');
console.log('=====================================');

// Testar Gate.io Spot
console.log('\n🌐 Testando Gate.io Spot...');
const gateioWs = new WebSocket('wss://api.gateio.ws/ws/v4/');

gateioWs.on('open', () => {
  console.log('✅ Gate.io Spot conectado!');
  
  const subscription = {
    id: Date.now(),
    time: Date.now(),
    channel: "spot.tickers",
    event: "subscribe",
    payload: ["BTC_USDT"]
  };
  
  console.log('📤 Enviando subscrição Gate.io:', subscription);
  gateioWs.send(JSON.stringify(subscription));
});

gateioWs.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 Gate.io mensagem:', message);
  } catch (error) {
    console.log('📨 Gate.io dados:', data.toString().substring(0, 100));
  }
});

gateioWs.on('error', (error) => {
  console.log('❌ Gate.io erro:', error.message);
});

// Testar MEXC Futures
setTimeout(() => {
  console.log('\n🌐 Testando MEXC Futures...');
  const mexcWs = new WebSocket('wss://contract.mexc.com/edge');
  
  mexcWs.on('open', () => {
    console.log('✅ MEXC Futures conectado!');
    
    const subscription = {
      method: "sub.ticker",
      param: { symbol: "BTC_USDT" }
    };
    
    console.log('📤 Enviando subscrição MEXC:', subscription);
    mexcWs.send(JSON.stringify(subscription));
  });
  
  mexcWs.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 MEXC mensagem:', message);
    } catch (error) {
      console.log('📨 MEXC dados:', data.toString().substring(0, 100));
    }
  });
  
  mexcWs.on('error', (error) => {
    console.log('❌ MEXC erro:', error.message);
  });
  
  // Fechar após 10 segundos
  setTimeout(() => {
    if (mexcWs.readyState === WebSocket.OPEN) {
      mexcWs.close();
    }
    if (gateioWs.readyState === WebSocket.OPEN) {
      gateioWs.close();
    }
    console.log('\n⏰ Teste concluído');
  }, 10000);
  
}, 2000); 