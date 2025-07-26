const WebSocket = require('ws');

const symbols = [
  'BTC_USDT',
  'ETH_USDT', 
  'SOL_USDT',
  'BNB_USDT',
  'ADA_USDT',
  'DOT_USDT',
  'AVAX_USDT',
  'MATIC_USDT',
  'LINK_USDT',
  'UNI_USDT',
  'LTC_USDT',
  'BCH_USDT',
  'XRP_USDT',
  'DOGE_USDT',
  'SHIB_USDT',
  'CBK_USDT',
  'FARM_USDT',
  'ACE_USDT',
  'CPOOL_USDT'
];

console.log('🔌 Testando símbolos no MEXC Futures (formato correto)...');

const mexcWs = new WebSocket('wss://contract.mexc.com/edge');

let testedSymbols = 0;
let workingSymbols = [];

mexcWs.on('open', () => {
  console.log('✅ MEXC Futures conectado!');
  testNextSymbol();
});

function testNextSymbol() {
  if (testedSymbols >= symbols.length) {
    console.log('\n📊 Resultados:');
    console.log(`✅ Símbolos funcionando: ${workingSymbols.length}`);
    console.log(`❌ Símbolos não funcionando: ${symbols.length - workingSymbols.length}`);
    if (workingSymbols.length > 0) {
      console.log('✅ Lista de símbolos funcionando:', workingSymbols);
    }
    mexcWs.close();
    process.exit(0);
  }
  
  const symbol = symbols[testedSymbols];
  console.log(`\n🔍 Testando: ${symbol}`);
  
  const subscribeMsg = {
    "method": "sub.ticker",
    "param": { "symbol": symbol }
  };
  
  mexcWs.send(JSON.stringify(subscribeMsg));
}

mexcWs.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.channel === 'rs.error') {
      console.log(`❌ ${symbols[testedSymbols]}: ${message.data}`);
    } else if (message.channel === 'push.ticker') {
      console.log(`✅ ${symbols[testedSymbols]}: Funcionando!`);
      workingSymbols.push(symbols[testedSymbols]);
    }
    
    testedSymbols++;
    setTimeout(testNextSymbol, 500); // Aguardar 500ms entre testes
    
  } catch (error) {
    console.log('❌ Erro ao processar mensagem:', error.message);
    testedSymbols++;
    setTimeout(testNextSymbol, 500);
  }
});

mexcWs.on('error', (error) => {
  console.error('❌ Erro MEXC:', error.message);
});

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  mexcWs.close();
  process.exit(0);
}, 30000); 