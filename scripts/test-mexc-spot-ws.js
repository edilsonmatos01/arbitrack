const WebSocket = require('ws');

const MEXC_SPOT_WS_URL = 'wss://wbs.mexc.com/ws';
const SYMBOLS = ['BTC_USDT', 'ETH_USDT', 'DODO_USDT'];

console.log('🔍 Testando conexão MEXC Spot...');
const ws = new WebSocket(MEXC_SPOT_WS_URL);

ws.on('open', () => {
  console.log('✅ Conectado ao MEXC Spot!');
  SYMBOLS.forEach(symbol => {
    const msg = {
      method: 'sub.ticker',
      param: { symbol }
    };
    ws.send(JSON.stringify(msg));
    console.log('📤 Subscrito:', symbol);
  });
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 30000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.channel === 'push.ticker' && msg.data) {
      console.log(`📨 ${msg.symbol}: Ask=${msg.data.ask1}, Bid=${msg.data.bid1}`);
    }
  } catch (e) {}
});

ws.on('error', (err) => {
  console.error('❌ Erro na conexão:', err.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
}); 