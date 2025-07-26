const WebSocket = require('ws');

console.log('🔍 Debugando oportunidades do worker...');

let priceUpdatesReceived = 0;
let arbitrageMessagesReceived = 0;
let opportunityMessagesReceived = 0;
let priceData = {};

// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'debug-worker',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update') {
      priceUpdatesReceived++;
      const { symbol, marketType, bestAsk, bestBid } = message;
      
      // Armazenar dados
      if (!priceData[symbol]) {
        priceData[symbol] = {};
      }
      
      if (marketType === 'spot') {
        priceData[symbol].spot = bestAsk;
      } else if (marketType === 'futures') {
        priceData[symbol].futures = bestBid;
      }
      
      // Verificar se temos dados completos para este símbolo
      if (priceData[symbol].spot && priceData[symbol].futures) {
        const spread = ((priceData[symbol].futures - priceData[symbol].spot) / priceData[symbol].spot) * 100;
        
        if (spread > 0.1 && spread < 50) {
          console.log(`🎯 OPORTUNIDADE POTENCIAL: ${symbol} - Spread: ${spread.toFixed(4)}%`);
          console.log(`   Spot: ${priceData[symbol].spot}, Futures: ${priceData[symbol].futures}`);
        }
      }
      
      if (priceUpdatesReceived % 50 === 0) {
        console.log(`📊 ${priceUpdatesReceived} price-updates recebidos`);
      }
    }
    else if (message.type === 'arbitrage') {
      arbitrageMessagesReceived++;
      console.log(`🎯 MENSAGEM DE ARBITRAGEM RECEBIDA #${arbitrageMessagesReceived}:`);
      console.log(`   Símbolo: ${message.baseSymbol}`);
      console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   Compra: ${message.buyAt.exchange} ${message.buyAt.marketType} @ ${message.buyAt.price}`);
      console.log(`   Venda: ${message.sellAt.exchange} ${message.sellAt.marketType} @ ${message.sellAt.price}`);
      console.log(`   Tipo: ${message.arbitrageType}`);
    }
    else if (message.type === 'opportunity') {
      opportunityMessagesReceived++;
      console.log(`🎯 MENSAGEM DE OPORTUNIDADE RECEBIDA #${opportunityMessagesReceived}:`);
      console.log(`   Símbolo: ${message.symbol}`);
      console.log(`   Spread: ${message.spread.toFixed(4)}%`);
      console.log(`   Spot: ${message.spotPrice}, Futures: ${message.futuresPrice}`);
      console.log(`   Direção: ${message.direction}`);
    }
    else {
      console.log(`📨 Outro tipo de mensagem: ${message.type}`);
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
  console.log(`📈 Price-updates recebidos: ${priceUpdatesReceived}`);
  console.log(`🎯 Mensagens de arbitragem: ${arbitrageMessagesReceived}`);
  console.log(`🎯 Mensagens de oportunidade: ${opportunityMessagesReceived}`);
  console.log(`📋 Símbolos com dados: ${Object.keys(priceData).length}`);
  
  // Mostrar oportunidades potenciais encontradas
  console.log('\n🔍 OPORTUNIDADES POTENCIAIS ENCONTRADAS:');
  let opportunitiesFound = 0;
  for (const [symbol, data] of Object.entries(priceData)) {
    if (data.spot && data.futures) {
      const spread = ((data.futures - data.spot) / data.spot) * 100;
      if (spread > 0.1 && spread < 50) {
        opportunitiesFound++;
        console.log(`  ${symbol}: ${spread.toFixed(4)}% (Spot: ${data.spot}, Futures: ${data.futures})`);
      }
    }
  }
  
  if (opportunitiesFound === 0) {
    console.log('  ❌ Nenhuma oportunidade válida encontrada');
    console.log('  💡 Possíveis causas:');
    console.log('     - Spreads muito baixos (< 0.1%)');
    console.log('     - Spreads muito altos (> 50%)');
    console.log('     - Dados incompletos (spot ou futures faltando)');
  }
});

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
  process.exit(0);
}, 30000); 