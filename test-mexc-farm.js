const WebSocket = require('ws');

console.log('🔌 Testando FARM no MEXC Futures...');

const mexcWs = new WebSocket('wss://contract.mexc.com/edge');

mexcWs.on('open', () => {
  console.log('✅ MEXC Futures conectado!');
  
  // Inscrever no FARMUSDT
  const subscribeMsg = {
    "method": "sub.ticker",
    "param": { "symbol": "FARMUSDT" }
  };
  
  mexcWs.send(JSON.stringify(subscribeMsg));
  console.log('📨 Inscrição enviada para FARMUSDT');
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
  console.log('\n⏰ Fechando conexão...');
  mexcWs.close();
  process.exit(0);
}, 10000); 