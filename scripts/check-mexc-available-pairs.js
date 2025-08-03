const WebSocket = require('ws');

console.log('🔍 VERIFICANDO PARES DISPONÍVEIS NO MEXC FUTURES');
console.log('================================================');

const MEXC_FUTURES_URL = 'wss://contract.mexc.com/edge';

// Lista de pares para testar (baseada na lista do worker)
const pairsToTest = [
  'BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT',
  'LINK_USDT', 'AAVE_USDT', 'APT_USDT', 'SUI_USDT', 'NEAR_USDT',
  'ONDO_USDT', '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT',
  'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT'
];

const ws = new WebSocket(MEXC_FUTURES_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  handshakeTimeout: 30000
});

let availablePairs = [];
let testedPairs = 0;

ws.on('open', () => {
  console.log('✅ Conectado ao MEXC Futures!');
  console.log(`📤 Testando ${pairsToTest.length} pares...`);
  
  // Testar cada par
  pairsToTest.forEach((pair, index) => {
    setTimeout(() => {
      const message = {
        method: "sub.ticker",
        param: { symbol: pair }
      };
      
      console.log(`📤 Testando ${pair}...`);
      ws.send(JSON.stringify(message));
    }, index * 1000); // 1 segundo entre cada teste
  });
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.channel === 'rs.sub.ticker') {
      testedPairs++;
      
      if (message.data === 'success') {
        // Par disponível - aguardar dados
        console.log(`✅ ${message.symbol || 'Par'} - Disponível`);
      } else {
        console.log(`❌ Par - Não disponível: ${message.data}`);
      }
    } else if (message.channel === 'push.ticker' && message.data) {
      // Recebeu dados do par
      const symbol = message.symbol;
      if (!availablePairs.includes(symbol)) {
        availablePairs.push(symbol);
        console.log(`🎯 ${symbol} - Dados recebidos! (bid1: ${message.data.bid1}, ask1: ${message.data.ask1})`);
      }
    }
    
    // Se testou todos os pares, fazer resumo
    if (testedPairs >= pairsToTest.length) {
      setTimeout(() => {
        console.log('\n📊 RESUMO DOS PARES DISPONÍVEIS:');
        console.log('================================');
        console.log(`Total testado: ${pairsToTest.length}`);
        console.log(`Disponíveis: ${availablePairs.length}`);
        console.log('\n✅ PARES DISPONÍVEIS:');
        availablePairs.forEach(pair => console.log(`   - ${pair}`));
        
        if (availablePairs.length > 0) {
          console.log('\n🎉 SUCESSO: Encontrados pares disponíveis!');
          console.log('   O worker pode usar estes pares para arbitragem');
        } else {
          console.log('\n⚠️  PROBLEMA: Nenhum par disponível');
          console.log('   Verificar se a lista de pares está correta');
        }
        
        ws.close();
      }, 5000); // Aguardar 5 segundos para receber dados
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

ws.on('close', () => {
  console.log('\n🔌 Conexão fechada');
}); 