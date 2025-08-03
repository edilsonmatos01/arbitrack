const WebSocket = require('ws');

console.log('🔍 Testando diferentes formatos de símbolos na MEXC Futures...');

const ws = new WebSocket('wss://contract.mexc.com/edge');

ws.on('open', () => {
  console.log('✅ Conectado à MEXC Futures!');
  
  // Testar diferentes formatos
  const testFormats = [
    { symbol: 'BTC_USDT', format: 'btcusdt' },
    { symbol: 'BTC_USDT', format: 'BTCUSDT' },
    { symbol: 'BTC_USDT', format: 'BTC_USDT' },
    { symbol: 'BTC_USDT', format: 'btc_usdt' },
    { symbol: 'DODO_USDT', format: 'dodousdt' },
    { symbol: 'DODO_USDT', format: 'DODOUSDT' },
    { symbol: 'DODO_USDT', format: 'DODO_USDT' },
    { symbol: 'DODO_USDT', format: 'dodo_usdt' }
  ];
  
  testFormats.forEach((test, index) => {
    setTimeout(() => {
      const message = {
        method: "sub.ticker",
        param: { symbol: test.format }
      };
      
      console.log(`📤 Teste ${index + 1}: ${test.symbol} como "${test.format}":`, JSON.stringify(message));
      ws.send(JSON.stringify(message));
    }, index * 2000); // 2 segundos entre cada teste
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
      console.log(`✅ SUCESSO! Dados de preço: ${message.symbol} - Ask: ${message.data.ask1}, Bid: ${message.data.bid1}`);
    } else if (message.channel === 'rs.error') {
      console.log(`❌ ERRO: ${message.data}`);
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