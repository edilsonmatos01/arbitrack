const WebSocket = require('ws');

console.log('🔍 Testando cálculo de oportunidades de arbitragem...');

// Simular dados de preços como o worker faria
const priceData = {};
let opportunitiesFound = 0;

// Função para calcular oportunidades (como no worker)
function calculateOpportunities() {
  console.log('\n📊 Calculando oportunidades...');
  console.log('💾 Dados de preços atuais:');
  
  for (const [symbol, data] of Object.entries(priceData)) {
    if (data.spot && data.futures) {
      console.log(`  ${symbol}: Spot=${data.spot}, Futures=${data.futures}`);
      
      const spread = ((data.futures - data.spot) / data.spot) * 100;
      console.log(`    Spread: ${spread.toFixed(4)}%`);
      
      if (spread > 0.1 && spread < 50) {
        console.log(`    ✅ OPORTUNIDADE ENCONTRADA! Spread: ${spread.toFixed(4)}%`);
        opportunitiesFound++;
      } else {
        console.log(`    ❌ Spread fora do range válido (0.1% - 50%)`);
      }
    } else {
      console.log(`  ${symbol}: Dados incompletos - Spot: ${data.spot || 'N/A'}, Futures: ${data.futures || 'N/A'}`);
    }
  }
  
  console.log(`\n📈 Total de oportunidades encontradas: ${opportunitiesFound}`);
}

// Conectar ao WebSocket para receber dados de preços
const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'opportunity-test',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update') {
      const { symbol, marketType, bestAsk, bestBid } = message;
      
      // Armazenar dados como o worker faria
      if (!priceData[symbol]) {
        priceData[symbol] = {};
      }
      
      if (marketType === 'spot') {
        priceData[symbol].spot = bestAsk; // Usar ask para spot (preço de compra)
      } else if (marketType === 'futures') {
        priceData[symbol].futures = bestBid; // Usar bid para futures (preço de venda)
      }
      
      console.log(`💾 ${symbol} ${marketType}: ${marketType === 'spot' ? 'Spot' : 'Futures'} = ${marketType === 'spot' ? bestAsk : bestBid}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro WebSocket:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Conexão fechada: ${code} - ${reason}`);
  
  console.log('\n📊 RESUMO FINAL:');
  console.log(`📈 Total de símbolos com dados: ${Object.keys(priceData).length}`);
  console.log(`💡 Oportunidades encontradas: ${opportunitiesFound}`);
  
  // Mostrar detalhes dos dados coletados
  console.log('\n📋 Detalhes dos dados:');
  for (const [symbol, data] of Object.entries(priceData)) {
    console.log(`  ${symbol}:`);
    console.log(`    Spot: ${data.spot || 'N/A'}`);
    console.log(`    Futures: ${data.futures || 'N/A'}`);
    
    if (data.spot && data.futures) {
      const spread = ((data.futures - data.spot) / data.spot) * 100;
      console.log(`    Spread: ${spread.toFixed(4)}%`);
      
      if (spread > 0.1 && spread < 50) {
        console.log(`    ✅ OPORTUNIDADE VÁLIDA!`);
      } else {
        console.log(`    ❌ Spread inválido`);
      }
    } else {
      console.log(`    ❌ Dados incompletos`);
    }
  }
});

// Calcular oportunidades a cada 10 segundos
let calculationCount = 0;
const calculationInterval = setInterval(() => {
  calculationCount++;
  console.log(`\n🔄 Cálculo #${calculationCount} (${new Date().toLocaleTimeString()})`);
  calculateOpportunities();
  
  if (calculationCount >= 6) { // 6 cálculos = 60 segundos
    clearInterval(calculationInterval);
    console.log('\n⏰ Finalizando teste após 60 segundos...');
    ws.close();
  }
}, 10000);

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  clearInterval(calculationInterval);
  ws.close();
  process.exit(0);
}, 70000); 