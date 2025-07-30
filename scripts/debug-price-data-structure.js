const WebSocket = require('ws');

console.log('🔍 Debugando estrutura dos dados de preços do worker...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let startTime = Date.now();
let opportunitiesWithZeroPrices = 0;
let opportunitiesWithValidPrices = 0;

ws.on('open', () => {
  console.log('✅ Conectado ao worker!');
  console.log('📡 Monitorando estrutura dos dados por 30 segundos...');
});

ws.on('message', (data) => {
  messageCount++;
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      const spotPrice = message.buyAt.price;
      const futuresPrice = message.sellAt.price;
      
      if (spotPrice > 0 && futuresPrice > 0) {
        opportunitiesWithValidPrices++;
        console.log(`✅ #${messageCount}: ${message.baseSymbol} - Preços VÁLIDOS`);
        console.log(`   - spotPrice: ${spotPrice} (${typeof spotPrice})`);
        console.log(`   - futuresPrice: ${futuresPrice} (${typeof futuresPrice})`);
        console.log(`   - spread: ${message.profitPercentage}%`);
      } else {
        opportunitiesWithZeroPrices++;
        console.log(`❌ #${messageCount}: ${message.baseSymbol} - Preços ZERO`);
        console.log(`   - spotPrice: ${spotPrice} (${typeof spotPrice})`);
        console.log(`   - futuresPrice: ${futuresPrice} (${typeof futuresPrice})`);
        console.log(`   - spread: ${message.profitPercentage}%`);
        console.log(`   - buyAt:`, message.buyAt);
        console.log(`   - sellAt:`, message.sellAt);
      }
      console.log('---');
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão WebSocket:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão WebSocket fechada');
});

// Timeout para parar o script
setTimeout(() => {
  console.log(`\n📊 RESUMO:`);
  console.log(`  - Total de mensagens recebidas: ${messageCount}`);
  console.log(`  - Oportunidades com preços válidos: ${opportunitiesWithValidPrices}`);
  console.log(`  - Oportunidades com preços zero: ${opportunitiesWithZeroPrices}`);
  console.log(`  - Tempo de execução: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  
  if (opportunitiesWithZeroPrices > 0) {
    console.log(`\n⚠️  PROBLEMA DETECTADO: ${opportunitiesWithZeroPrices} oportunidades com preços zero!`);
    console.log(`   Isso indica que há dados antigos ou inválidos no priceData.`);
  } else {
    console.log(`\n✅ TODAS as oportunidades têm preços válidos!`);
  }
  
  ws.close();
  process.exit(0);
}, 30000); 