const fetch = require('node-fetch');

// Testar endpoints CORRETOS de futures da MEXC
async function testMexcFuturesCorrect() {
  console.log('🔍 TESTANDO ENDPOINTS CORRETOS DE FUTURES DA MEXC');
  console.log('==================================================');
  
  const endpoints = [
    // Endpoints corretos da MEXC para futures perpétuos
    'https://api.mexc.com/api/v3/ticker/24hr', // Spot (para comparação)
    'https://api.mexc.com/api/v3/contract/ticker/24hr', // Contract/Futures
    'https://api.mexc.com/api/v3/contract/ticker/price', // Contract prices
    'https://api.mexc.com/api/v3/contract/exchangeInfo', // Contract info
    'https://api.mexc.com/api/v3/contract/klines?symbol=BTCUSDT&interval=1m&limit=1', // Contract klines
    
    // Endpoints alternativos
    'https://api.mexc.com/api/v3/contract/ticker/bookTicker',
    'https://api.mexc.com/api/v3/contract/depth?symbol=BTCUSDT&limit=5',
    
    // Endpoints específicos para perpétuos
    'https://api.mexc.com/api/v3/contract/fundingRate?symbol=BTCUSDT',
    'https://api.mexc.com/api/v3/contract/openInterest?symbol=BTCUSDT',
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log(`✅ Resposta: Array com ${data.length} itens`);
        if (data.length > 0) {
          console.log(`📊 Primeiro item:`, JSON.stringify(data[0], null, 2));
          
          // Procurar pelos pares específicos
          const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
          const foundPairs = [];
          
          pairs.forEach(pair => {
            const found = data.find(item => item.symbol === pair);
            if (found) {
              foundPairs.push(pair);
              console.log(`  ✅ ${pair}: $${found.lastPrice || found.price}`);
            }
          });
          
          if (foundPairs.length > 0) {
            console.log(`  🎯 Pares encontrados: ${foundPairs.join(', ')}`);
          }
        }
      } else {
        console.log(`✅ Resposta: Objeto`);
        console.log(`📊 Dados:`, JSON.stringify(data, null, 2));
      }
      
    } catch (error) {
      console.error(`❌ Erro:`, error.message);
    }
  }
}

// Testar WebSocket para futures
async function testMexcFuturesWebSocket() {
  console.log('\n🔍 TESTANDO WEBSOCKET DE FUTURES DA MEXC');
  console.log('==========================================');
  
  const WebSocket = require('ws');
  const wsUrl = 'wss://wbs.mexc.com/ws';
  
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('✅ WebSocket conectado');
      
      // Tentar subscrever em contract/futures
      const contractSubscriptions = [
        { method: 'sub.contract.ticker', param: { symbol: 'btcusdt' } },
        { method: 'sub.contract@ticker', param: { symbol: 'btcusdt' } },
        { method: 'sub.contract@depth', param: { symbol: 'btcusdt' } },
        { method: 'sub.contract@kline', param: { symbol: 'btcusdt', interval: '1m' } }
      ];
      
      let subscriptionIndex = 0;
      
      const sendNextSubscription = () => {
        if (subscriptionIndex < contractSubscriptions.length) {
          const sub = contractSubscriptions[subscriptionIndex];
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

// Executar testes
async function runAllTests() {
  await testMexcFuturesCorrect();
  await testMexcFuturesWebSocket();
  
  console.log('\n🏁 TESTES CONCLUÍDOS');
  console.log('===================');
}

runAllTests().catch(console.error); 