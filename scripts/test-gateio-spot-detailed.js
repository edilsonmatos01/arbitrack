const WebSocket = require('ws');

const GATEIO_SPOT_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const TEST_SYMBOLS = ['BTC_USDT', 'ETH_USDT', 'DODO_USDT', '1DOLLAR_USDT', 'ACA_USDT'];

console.log('🔍 Testando Gate.io Spot - Conexão Detalhada...');
console.log('📊 Símbolos de teste:', TEST_SYMBOLS.join(', '));
console.log('⏱️ Duração: 30 segundos\n');

const ws = new WebSocket(GATEIO_SPOT_WS_URL);
let messageCount = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao Gate.io Spot!');
  console.log('📤 Enviando subscrições...\n');
  
  TEST_SYMBOLS.forEach(symbol => {
    const msg = {
      id: Date.now(),
      time: Date.now(),
      channel: 'spot.tickers',
      event: 'subscribe',
      payload: [symbol]
    };
    ws.send(JSON.stringify(msg));
    console.log(`📤 Subscrito: ${symbol}`);
  });
  
  setTimeout(() => {
    console.log('\n⏰ Teste concluído após 30 segundos');
    console.log(`📊 Total de mensagens recebidas: ${messageCount}`);
    ws.close();
    process.exit(0);
  }, 30000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    messageCount++;
    
    if (msg.channel === 'spot.tickers' && msg.result) {
      const symbol = msg.result.currency_pair;
      const ask = parseFloat(msg.result.lowest_ask);
      const bid = parseFloat(msg.result.highest_bid);
      const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      console.log(`📨 [${time}] ${symbol}: Ask=${ask} Bid=${bid}`);
    } else if (msg.event) {
      console.log(`📋 Evento: ${msg.event} - ${msg.result || msg.error || 'ok'}`);
    }
  } catch (e) {
    console.log('❌ Erro ao processar mensagem:', e.message);
  }
});

ws.on('error', (err) => {
  console.error('❌ Erro na conexão:', err.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
}); 