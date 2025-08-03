const WebSocket = require('ws');

const GATEIO_FUTURES_WS_URL = 'wss://fx-ws.gateio.ws/v4/ws/usdt';
const SYMBOLS = ['BTC_USDT', 'ETH_USDT', 'DODO_USDT'];

console.log('🔍 Testando conexão Gate.io Futures...');
const ws = new WebSocket(GATEIO_FUTURES_WS_URL);

ws.on('open', () => {
  console.log('✅ Conectado ao Gate.io Futures!');
  SYMBOLS.forEach(symbol => {
    const msg = {
      id: Date.now(),
      time: Date.now(),
      channel: 'futures.tickers',
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
    if (msg.channel === 'futures.tickers' && msg.result) {
      console.log(`📨 ${msg.result.contract}: Ask=${msg.result.lowest_ask}, Bid=${msg.result.highest_bid}`);
    }
  } catch (e) {}
});

ws.on('error', (err) => {
  console.error('❌ Erro na conexão:', err.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
}); 