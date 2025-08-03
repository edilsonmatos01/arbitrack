const WebSocket = require('ws');

console.log('🧪 TESTE MEXC FUTURES APENAS');
console.log('============================');

const mexcWs = new WebSocket('wss://contract.mexc.com/edge');

mexcWs.on('open', () => {
  console.log('✅ MEXC Futures conectado!');
  
  // Testar diferentes formatos de subscrição
  const subscriptions = [
    {
      method: "sub.ticker",
      param: { symbol: "BTC_USDT" }
    },
    {
      method: "SUBSCRIPTION",
      params: ["contract.ticker.BTC_USDT"]
    },
    {
      method: "sub.kline",
      param: { symbol: "BTC_USDT", interval: "1m" }
    }
  ];
  
  let index = 0;
  
  function sendNextSubscription() {
    if (index < subscriptions.length) {
      const sub = subscriptions[index];
      console.log(`📤 Tentativa ${index + 1}:`, sub);
      mexcWs.send(JSON.stringify(sub));
      index++;
      
      setTimeout(sendNextSubscription, 2000);
    }
  }
  
  sendNextSubscription();
});

mexcWs.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 MEXC resposta:', message);
    
    if (message.channel === 'push.ticker') {
      console.log('✅ Dados de ticker recebidos!');
      console.log('   Símbolo:', message.symbol);
      console.log('   Ask:', message.data.ask1);
      console.log('   Bid:', message.data.bid1);
    }
  } catch (error) {
    console.log('📨 Dados (não JSON):', data.toString().substring(0, 100));
  }
});

mexcWs.on('error', (error) => {
  console.log('❌ MEXC erro:', error.message);
});

mexcWs.on('close', (code, reason) => {
  console.log(`🔌 MEXC fechado: ${code} - ${reason}`);
});

// Timeout
setTimeout(() => {
  if (mexcWs.readyState === WebSocket.OPEN) {
    mexcWs.close();
  }
  console.log('\n⏰ Teste concluído');
}, 15000); 