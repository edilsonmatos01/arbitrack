const WebSocket = require('ws');

// Testar WebSocket da MEXC para futures
async function testMexcWebSocketFutures() {
  console.log('🔍 TESTANDO WEBSOCKET DE FUTURES DA MEXC');
  console.log('=========================================');
  
  const wsUrl = 'wss://wbs.mexc.com/ws';
  
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('✅ WebSocket conectado');
      
      // Tentar subscrever em futures
      const futuresSubscriptions = [
        { method: 'sub.futures.ticker', param: { symbol: 'btcusdt' } },
        { method: 'sub.contract.ticker', param: { symbol: 'btcusdt' } },
        { method: 'sub.futures@ticker', param: { symbol: 'btcusdt' } },
        { method: 'sub.contract@ticker', param: { symbol: 'btcusdt' } }
      ];
      
      let subscriptionIndex = 0;
      
      const sendNextSubscription = () => {
        if (subscriptionIndex < futuresSubscriptions.length) {
          const sub = futuresSubscriptions[subscriptionIndex];
          console.log(`📡 Tentando: ${JSON.stringify(sub)}`);
          ws.send(JSON.stringify(sub));
          subscriptionIndex++;
          
          setTimeout(sendNextSubscription, 2000);
        } else {
          console.log('⏰ Aguardando 10 segundos para receber dados...');
          setTimeout(() => {
            ws.close();
            resolve();
          }, 10000);
        }
      };
      
      sendNextSubscription();
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Mensagem recebida:', message);
        
        if (message.code !== undefined) {
          if (message.code === 0) {
            console.log('✅ Subscrição aceita!');
          } else {
            console.log(`❌ Erro na subscrição: ${message.msg}`);
          }
        }
      } catch (error) {
        console.log('📨 Dados recebidos (não JSON):', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ Erro no WebSocket:', error.message);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket fechado');
    });
  });
}

// Executar teste
testMexcWebSocketFutures().then(() => {
  console.log('\n🏁 TESTE WEBSOCKET CONCLUÍDO');
}); 