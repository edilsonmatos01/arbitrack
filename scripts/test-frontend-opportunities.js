const WebSocket = require('ws');

console.log('🔍 Testando recebimento de oportunidades no frontend...');

// Simular o estado do React
let opportunities = [];
let livePrices = {};

// Simular o hook useArbitrageWebSocket
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
    console.log(`🎯 Oportunidade recebida: ${opportunity.baseSymbol} - ${opportunity.profitPercentage.toFixed(4)}%`);
    
    // Manter apenas as últimas 50 oportunidades
    if (opportunities.length > 50) {
      opportunities = opportunities.slice(-50);
    }
  }
};

// Simular o filtro da tabela
const filterOpportunities = (minSpread = 0.001) => {
  console.log(`\n🔍 Filtrando oportunidades (minSpread: ${minSpread}%)...`);
  console.log(`📊 Total de oportunidades recebidas: ${opportunities.length}`);
  
  const filtered = opportunities.filter(opp => {
    // Validação básica
    if (!opp || !opp.buyAt || !opp.sellAt) {
      console.log(`❌ Oportunidade inválida: ${opp?.baseSymbol || 'N/A'}`);
      return false;
    }
    
    // Verificar se tem preços válidos
    if (!opp.buyAt.price || !opp.sellAt.price || opp.buyAt.price <= 0 || opp.sellAt.price <= 0) {
      console.log(`❌ Oportunidade com preços inválidos: ${opp.baseSymbol}`);
      return false;
    }
    
    const isSpotBuyFuturesSell = opp.buyAt.marketType === 'spot' && opp.sellAt.marketType === 'futures';
    const spread = opp.profitPercentage;
    
    console.log(`📋 ${opp.baseSymbol}: Spot=${opp.buyAt.marketType}, Futures=${opp.sellAt.marketType}, Spread=${spread.toFixed(4)}%`);
    
    const isValid = isSpotBuyFuturesSell && spread >= minSpread;
    console.log(`   ${isValid ? '✅' : '❌'} Válida: ${isValid}`);
    
    return isValid;
  });
  
  console.log(`✅ Oportunidades válidas: ${filtered.length}/${opportunities.length}`);
  return filtered;
};

// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let arbitrageCount = 0;

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
      
      // Testar filtro a cada 5 oportunidades
      if (arbitrageCount % 5 === 0) {
        const filtered = filterOpportunities(0.001); // minSpread = 0.001%
        
        if (filtered.length > 0) {
          console.log(`\n📋 OPORTUNIDADES VÁLIDAS PARA A TABELA:`);
          filtered.slice(0, 10).forEach((opp, index) => {
            console.log(`   ${index + 1}. ${opp.baseSymbol}: ${opp.profitPercentage.toFixed(4)}%`);
          });
        } else {
          console.log(`\n⚠️ Nenhuma oportunidade válida para exibir na tabela`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('close', (code, reason) => {
  console.log(`\n🔌 Conexão fechada: ${code} - ${reason}`);
  
  console.log(`\n📊 RESUMO FINAL:`);
  console.log(`   Total de mensagens: ${messageCount}`);
  console.log(`   Arbitragens recebidas: ${arbitrageCount}`);
  console.log(`   Oportunidades em memória: ${opportunities.length}`);
  
  // Teste final do filtro
  const filtered = filterOpportunities(0.001);
  console.log(`   Oportunidades válidas para tabela: ${filtered.length}`);
  
  if (filtered.length > 0) {
    console.log(`\n🎯 OPORTUNIDADES FINAIS PARA A TABELA:`);
    filtered.slice(0, 10).forEach((opp, index) => {
      console.log(`   ${index + 1}. ${opp.baseSymbol}: ${opp.profitPercentage.toFixed(4)}%`);
    });
  } else {
    console.log(`\n❌ PROBLEMA: Nenhuma oportunidade válida encontrada!`);
    console.log(`   Possíveis causas:`);
    console.log(`   - Spread mínimo muito alto (0.001%)`);
    console.log(`   - Estrutura das oportunidades incorreta`);
    console.log(`   - Dados de preços inválidos`);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro WebSocket:', error);
});

// Timeout para encerrar o teste
setTimeout(() => {
  console.log(`\n⏰ Timeout - Fechando conexão...`);
  ws.close();
}, 30000); 