const WebSocket = require('ws');

console.log('🔍 Testando conexão MEXC Futures...');

const ws = new WebSocket('wss://contract.mexc.com/edge');

ws.on('open', () => {
  console.log('✅ Conectado à MEXC Futures!');
  
  // Testar com alguns símbolos específicos
  const testSymbols = ['BTC_USDT', 'ETH_USDT', 'DODO_USDT'];
  
  testSymbols.forEach(symbol => {
    const message = {
      method: "sub.ticker",
      param: { symbol: symbol.replace('_', '').toLowerCase() }
    };
    
    console.log(`📤 Enviando subscrição para ${symbol}:`, JSON.stringify(message));
    ws.send(JSON.stringify(message));
  });
  
  // Encerrar após 30 segundos
  setTimeout(() => {
    console.log('⏰ Encerrando teste após 30 segundos...');
    ws.close();
    process.exit(0);
  }, 30000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Mensagem recebida:', JSON.stringify(message, null, 2));
    
    if (message.channel === 'push.ticker' && message.data) {
      console.log(`✅ Dados de preço: ${message.symbol} - Ask: ${message.data.ask1}, Bid: ${message.data.bid1}`);
    }
  } catch (error) {
    console.log('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Conexão fechada - Código: ${code}, Razão: ${reason}`);
}); 