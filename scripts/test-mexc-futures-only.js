const WebSocket = require('ws');

console.log('🔌 Testando conexão MEXC Futures...');

const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';
const symbols = ['PIN_USDT', 'DODO_USDT', 'BTC_USDT'];

const ws = new WebSocket(MEXC_FUTURES_WS_URL);

ws.on('open', () => {
  console.log('✅ Conectado ao MEXC Futures!');
  console.log('📊 Enviando subscrições...');
  
  symbols.forEach((symbol) => {
    const msg = {
      method: 'sub.ticker',
      param: { symbol },
    };
    console.log(`📤 Enviando subscrição para ${symbol}:`, JSON.stringify(msg));
    ws.send(JSON.stringify(msg));
  });
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('📨 Mensagem recebida do MEXC Futures:', JSON.stringify(msg, null, 2));
    
    if (msg.channel === 'push.ticker' && msg.data && msg.symbol) {
      const symbol = msg.symbol;
      const bid = parseFloat(msg.data.bid1);
      const ask = parseFloat(msg.data.ask1);
      console.log(`📈 PREÇO MEXC FUTURES: ${symbol}`);
      console.log(`   Ask: ${ask}, Bid: ${bid}`);
      console.log('---');
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão MEXC Futures:', error);
});

ws.on('close', () => {
  console.log('🔌 Conexão MEXC Futures fechada');
});

// Manter o script rodando por 30 segundos
setTimeout(() => {
  console.log('⏰ Teste concluído. Fechando conexão...');
  ws.close();
  process.exit(0);
}, 30000); 