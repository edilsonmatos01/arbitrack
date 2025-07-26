const WebSocket = require('ws');

const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';
const TEST_SYMBOLS = ['BTC_USDT', 'ETH_USDT', 'DODO_USDT', '1DOLLAR_USDT', 'ACA_USDT'];

console.log('🔍 Testando MEXC Futures - Conexão Detalhada...');
console.log('📊 Símbolos de teste:', TEST_SYMBOLS.join(', '));
console.log('⏱️ Duração: 30 segundos\n');

const ws = new WebSocket(MEXC_FUTURES_WS_URL);
let messageCount = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao MEXC Futures!');
  console.log('📤 Enviando subscrições...\n');
  
  TEST_SYMBOLS.forEach(symbol => {
    const msg = {
      method: 'sub.ticker',
      param: { symbol }
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
    
    if (msg.channel === 'push.ticker' && msg.data && msg.symbol) {
      const symbol = msg.symbol;
      const ask = parseFloat(msg.data.ask1);
      const bid = parseFloat(msg.data.bid1);
      const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      console.log(`📨 [${time}] ${symbol}: Ask=${ask} Bid=${bid}`);
    } else if (msg.code) {
      console.log(`📋 Código: ${msg.code} - ${msg.msg || 'sem mensagem'}`);
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