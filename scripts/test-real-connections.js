const WebSocket = require('ws');

console.log('🧪 TESTE - CONEXÕES REAIS DAS EXCHANGES');
console.log('=======================================');

// URLs das exchanges
const GATEIO_SPOT_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_FUTURES_URL = 'wss://contract.mexc.com/edge';

let gateioConnected = false;
let mexcConnected = false;
let gateioData = false;
let mexcData = false;

// Teste Gate.io Spot
console.log('\n🌐 Testando Gate.io Spot...');
const gateioWs = new WebSocket(GATEIO_SPOT_URL);

gateioWs.on('open', () => {
  console.log('✅ Gate.io Spot conectado!');
  gateioConnected = true;
  
  // Enviar subscrição
  const message = {
    id: Date.now(),
    time: Date.now(),
    channel: "spot.tickers",
    event: "subscribe",
    payload: ["BTC_USDT"]
  };
  
  console.log('📤 Enviando subscrição Gate.io:', JSON.stringify(message));
  gateioWs.send(JSON.stringify(message));
});

gateioWs.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Gate.io mensagem:', JSON.stringify(message, null, 2));
    gateioData = true;
  } catch (error) {
    console.error('❌ Erro ao processar mensagem Gate.io:', error);
  }
});

gateioWs.on('error', (error) => {
  console.error('❌ Erro Gate.io:', error.message);
});

// Teste MEXC Futures
console.log('\n🌐 Testando MEXC Futures...');
const mexcWs = new WebSocket(MEXC_FUTURES_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  handshakeTimeout: 30000
});

mexcWs.on('open', () => {
  console.log('✅ MEXC Futures conectado!');
  mexcConnected = true;
  
  // Enviar subscrição
  const message = {
    method: "sub.ticker",
    param: { symbol: "BTC_USDT" }
  };
  
  console.log('📤 Enviando subscrição MEXC:', JSON.stringify(message));
  mexcWs.send(JSON.stringify(message));
});

mexcWs.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 MEXC mensagem:', JSON.stringify(message, null, 2));
    mexcData = true;
  } catch (error) {
    console.error('❌ Erro ao processar mensagem MEXC:', error);
  }
});

mexcWs.on('error', (error) => {
  console.error('❌ Erro MEXC:', error.message);
});

// Aguardar 30 segundos e fazer resumo
setTimeout(() => {
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('=====================');
  console.log(`Gate.io Spot: ${gateioConnected ? '✅ Conectado' : '❌ Falhou'}`);
  console.log(`Gate.io Dados: ${gateioData ? '✅ Recebendo' : '❌ Sem dados'}`);
  console.log(`MEXC Futures: ${mexcConnected ? '✅ Conectado' : '❌ Falhou'}`);
  console.log(`MEXC Dados: ${mexcData ? '✅ Recebendo' : '❌ Sem dados'}`);
  
  if (gateioConnected && mexcConnected && gateioData && mexcData) {
    console.log('\n🎉 SUCESSO: Todas as conexões funcionando!');
    console.log('   O worker deveria estar processando oportunidades');
  } else {
    console.log('\n⚠️  PROBLEMA: Algumas conexões falharam');
    console.log('   Verificar configurações das WebSockets');
  }
  
  // Fechar conexões
  gateioWs.close();
  mexcWs.close();
}, 30000); 