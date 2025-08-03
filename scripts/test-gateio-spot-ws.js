const WebSocket = require('ws');

const GATEIO_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const SYMBOLS = ['BTC_USDT', 'ETH_USDT', 'DODO_USDT'];

console.log('🔍 Testando conexão Gate.io Spot (COMPRA)...');
const ws = new WebSocket(GATEIO_WS_URL);

ws.on('open', () => {
  console.log('✅ Conectado ao Gate.io Spot!');
  SYMBOLS.forEach(symbol => {
    const msg = {
      id: Date.now(),
      time: Date.now(),
      channel: 'spot.tickers',
      event: 'subscribe',
      payload: [symbol]
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
    if (msg.channel === 'spot.tickers' && msg.result) {
      console.log(`📨 ${msg.result.currency_pair}: Ask=${msg.result.lowest_ask}, Bid=${msg.result.highest_bid}`);
    }
  } catch (e) {}
});

ws.on('error', (err) => {
  console.error('❌ Erro na conexão:', err.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
}); 