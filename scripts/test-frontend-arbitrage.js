const WebSocket = require('ws');

console.log('🔍 Testando recebimento de arbitragem no frontend...');

// Simular o comportamento do hook useArbitrageWebSocket
let opportunities = [];
let livePrices = {};

// Função para processar mensagens de arbitragem (como no frontend)
const processArbitrageMessage = (message) => {
  if (message.type === 'arbitrage') {
    const opportunity = {
      id: Date.now(),
      baseSymbol: message.baseSymbol,
      profitPercentage: message.profitPercentage,
      buyAt: message.buyAt,
      sellAt: message.sellAt,
      arbitrageType: message.arbitrageType,
      timestamp: message.timestamp
    };
    
    opportunities.push(opportunity);
    console.log(`🎯 Oportunidade processada: ${opportunity.baseSymbol} - ${opportunity.profitPercentage.toFixed(4)}%`);
    
    // Manter apenas as últimas 50 oportunidades
    if (opportunities.length > 50) {
      opportunities = opportunities.slice(-50);
    }
  }
};

// Função para processar mensagens de price-update (como no frontend)
const processPriceUpdate = (message) => {
  if (message.type === 'price-update') {
    const { symbol, marketType, bestAsk, bestBid } = message;
    
    if (!livePrices[symbol]) {
      livePrices[symbol] = {};
    }
    
    livePrices[symbol][marketType] = {
      bestAsk,
      bestBid,
      timestamp: message.timestamp
    };
    
    console.log(`💰 Preço atualizado: ${symbol} ${marketType} - Ask: ${bestAsk}, Bid: ${bestBid}`);
  }
};

// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let arbitrageCount = 0;
let priceUpdateCount = 0;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'frontend-test',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    messageCount++;
    
    if (message.type === 'arbitrage') {
      arbitrageCount++;
      processArbitrageMessage(message);
      
      console.log(`\n🎯 ARBITRAGEM #${arbitrageCount}:`);
      console.log(`   Símbolo: ${message.baseSymbol}`);
      console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   Compra: ${message.buyAt.exchange} ${message.buyAt.marketType} @ ${message.buyAt.price}`);
      console.log(`   Venda: ${message.sellAt.exchange} ${message.sellAt.marketType} @ ${message.sellAt.price}`);
      console.log(`   Tipo: ${message.arbitrageType}`);
      
    } else if (message.type === 'price-update') {
      priceUpdateCount++;
      processPriceUpdate(message);
      
    } else if (message.type === 'connection') {
      console.log('📨 Mensagem de conexão recebida');
    }
    
    // Mostrar estatísticas a cada 50 mensagens
    if (messageCount % 50 === 0) {
      console.log(`\n📊 Estatísticas (${messageCount} mensagens):`);
      console.log(`   Price-updates: ${priceUpdateCount}`);
      console.log(`   Arbitragens: ${arbitrageCount}`);
      console.log(`   Oportunidades em memória: ${opportunities.length}`);
      console.log(`   Símbolos com preços: ${Object.keys(livePrices).length}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('close', (code, reason) => {
  console.log(`\n🔌 Conexão fechada: ${code} - ${reason}`);
  
  console.log(`\n📊 RESUMO FINAL:`);
  console.log(`   Total de mensagens: ${messageCount}`);
  console.log(`   Price-updates: ${priceUpdateCount}`);
  console.log(`   Arbitragens: ${arbitrageCount}`);
  console.log(`   Oportunidades processadas: ${opportunities.length}`);
  
  if (opportunities.length > 0) {
    console.log(`\n🎯 ÚLTIMAS OPORTUNIDADES:`);
    opportunities.slice(-10).forEach((opp, index) => {
      console.log(`   ${index + 1}. ${opp.baseSymbol}: ${opp.profitPercentage.toFixed(4)}%`);
    });
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro WebSocket:', error);
});

// Timeout para encerrar o teste
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
}, 30000); 