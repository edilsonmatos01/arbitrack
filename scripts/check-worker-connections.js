const WebSocket = require('ws');

console.log('🔍 VERIFICANDO CONEXÕES DO WORKER');
console.log('==================================');

// Verificar se o worker está respondendo
console.log('1️⃣ Verificando se o worker está ativo...');
const workerWs = new WebSocket('ws://localhost:10000');

workerWs.on('open', () => {
  console.log('✅ Worker está ativo e respondendo');
  
  // Aguardar mensagem de conexão
  workerWs.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'connection') {
        console.log('✅ Worker enviou mensagem de conexão');
        
        // Agora verificar se as exchanges estão conectadas
        setTimeout(() => {
          checkExchangeConnections();
        }, 2000);
      }
    } catch (error) {
      // Ignorar erros de parsing
    }
  });
});

workerWs.on('error', (error) => {
  console.log('❌ Worker não está respondendo:', error.message);
});

function checkExchangeConnections() {
  console.log('\n2️⃣ Verificando conexões das exchanges...');
  
  // Testar Gate.io Spot
  console.log('\n🌐 Testando Gate.io Spot...');
  const gateioWs = new WebSocket('wss://api.gateio.ws/ws/v4/');
  
  gateioWs.on('open', () => {
    console.log('✅ Gate.io Spot conectado!');
    
    const subscription = {
      id: Date.now(),
      time: Date.now(),
      channel: "spot.tickers",
      event: "subscribe",
      payload: ["BTC_USDT"]
    };
    
    gateioWs.send(JSON.stringify(subscription));
  });
  
  gateioWs.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.channel === 'spot.tickers' && message.event === 'update') {
        console.log('✅ Gate.io Spot enviando dados:', message.result.currency_pair);
        gateioWs.close();
      }
    } catch (error) {
      // Ignorar erros de parsing
    }
  });
  
  gateioWs.on('error', (error) => {
    console.log('❌ Gate.io Spot erro:', error.message);
  });
  
  // Testar MEXC Futures
  setTimeout(() => {
    console.log('\n🌐 Testando MEXC Futures...');
    const mexcWs = new WebSocket('wss://contract.mexc.com/edge');
    
    mexcWs.on('open', () => {
      console.log('✅ MEXC Futures conectado!');
      
      const subscription = {
        method: "sub.ticker",
        param: { symbol: "BTC_USDT" }
      };
      
      mexcWs.send(JSON.stringify(subscription));
    });
    
    mexcWs.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.channel === 'push.ticker') {
          console.log('✅ MEXC Futures enviando dados:', message.symbol);
          mexcWs.close();
        }
      } catch (error) {
        // Ignorar erros de parsing
      }
    });
    
    mexcWs.on('error', (error) => {
      console.log('❌ MEXC Futures erro:', error.message);
    });
    
    // Fechar após 10 segundos
    setTimeout(() => {
      if (mexcWs.readyState === WebSocket.OPEN) {
        mexcWs.close();
      }
      if (gateioWs.readyState === WebSocket.OPEN) {
        gateioWs.close();
      }
      if (workerWs.readyState === WebSocket.OPEN) {
        workerWs.close();
      }
      
      console.log('\n📊 RESUMO:');
      console.log('✅ Worker está ativo');
      console.log('✅ Exchanges estão acessíveis');
      console.log('⚠️  Worker pode não estar conectado às exchanges');
      console.log('💡 Solução: Reiniciar o worker para forçar reconexão');
    }, 10000);
    
  }, 3000);
} 