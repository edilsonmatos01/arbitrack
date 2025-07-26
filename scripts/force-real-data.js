const WebSocket = require('ws');

console.log('🧪 FORÇANDO DADOS REAIS NO WORKER');
console.log('==================================');

// Primeiro, obter dados reais das exchanges
async function getRealData() {
  return new Promise((resolve) => {
    let gateioData = null;
    let mexcData = null;
    
    // Conectar ao Gate.io
    const gateioWs = new WebSocket('wss://api.gateio.ws/ws/v4/');
    
    gateioWs.on('open', () => {
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
        if (message.channel === 'spot.tickers' && message.event === 'update' && message.result) {
          gateioData = {
            symbol: message.result.currency_pair,
            bestAsk: parseFloat(message.result.lowest_ask),
            bestBid: parseFloat(message.result.highest_bid)
          };
          console.log('📊 Gate.io dados:', gateioData);
          gateioWs.close();
        }
      } catch (error) {
        // Ignorar erros de parsing
      }
    });
    
    // Conectar ao MEXC
    setTimeout(() => {
      const mexcWs = new WebSocket('wss://contract.mexc.com/edge');
      
      mexcWs.on('open', () => {
        const subscription = {
          method: "sub.ticker",
          param: { symbol: "BTC_USDT" }
        };
        mexcWs.send(JSON.stringify(subscription));
      });
      
      mexcWs.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          if (message.channel === 'push.ticker' && message.data) {
            mexcData = {
              symbol: message.data.symbol,
              bestAsk: parseFloat(message.data.ask1),
              bestBid: parseFloat(message.data.bid1)
            };
            console.log('📊 MEXC dados:', mexcData);
            mexcWs.close();
          }
        } catch (error) {
          // Ignorar erros de parsing
        }
      });
    }, 1000);
    
    // Aguardar dados e resolver
    setTimeout(() => {
      resolve({ gateioData, mexcData });
    }, 5000);
  });
}

// Função principal
async function main() {
  console.log('🔍 Obtendo dados reais das exchanges...');
  const { gateioData, mexcData } = await getRealData();
  
  if (!gateioData || !mexcData) {
    console.log('❌ Não foi possível obter dados das exchanges');
    return;
  }
  
  console.log('\n📊 DADOS REAIS OBTIDOS:');
  console.log('Gate.io Spot:', gateioData);
  console.log('MEXC Futures:', mexcData);
  
  // Calcular spread manualmente
  const spread = ((mexcData.bestAsk - gateioData.bestBid) / gateioData.bestBid) * 100;
  console.log(`\n📈 SPREAD CALCULADO: ${spread.toFixed(4)}%`);
  
  if (spread > 0.01) {
    console.log('🎯 OPORTUNIDADE DETECTADA!');
  } else {
    console.log('⚠️  Spread insuficiente para arbitragem');
  }
  
  // Conectar ao worker e enviar dados
  console.log('\n🔗 Conectando ao worker...');
  const workerWs = new WebSocket('ws://localhost:10000');
  
  workerWs.on('open', () => {
    console.log('✅ Conectado ao worker!');
    
    // Enviar dados no formato que o worker espera
    const gateioMessage = {
      channel: 'spot.tickers',
      event: 'update',
      result: {
        currency_pair: gateioData.symbol,
        lowest_ask: gateioData.bestAsk.toString(),
        highest_bid: gateioData.bestBid.toString()
      }
    };
    
    const mexcMessage = {
      channel: 'push.ticker',
      symbol: mexcData.symbol,
      data: {
        symbol: mexcData.symbol,
        ask1: mexcData.bestAsk,
        bid1: mexcData.bestBid
      }
    };
    
    console.log('📤 Enviando dados Gate.io para worker...');
    workerWs.send(JSON.stringify(gateioMessage));
    
    setTimeout(() => {
      console.log('📤 Enviando dados MEXC para worker...');
      workerWs.send(JSON.stringify(mexcMessage));
    }, 1000);
  });
  
  workerWs.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 Worker resposta:', message);
      
      if (message.type === 'arbitrage' || message.type === 'opportunity') {
        console.log('🎯 OPORTUNIDADE DETECTADA PELO WORKER!');
      }
    } catch (error) {
      console.log('📨 Worker dados:', data.toString().substring(0, 100));
    }
  });
  
  // Timeout
  setTimeout(() => {
    if (workerWs.readyState === WebSocket.OPEN) {
      workerWs.close();
    }
    console.log('\n⏰ Teste concluído');
  }, 10000);
}

main().catch(console.error); 