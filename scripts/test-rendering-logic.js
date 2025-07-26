// Script para testar a lógica de renderização
console.log('🔍 Testando lógica de renderização...');

// Simular dados reais que estão chegando do worker
const mockOpportunities = [
  {
    baseSymbol: 'CBK_USDT',
    profitPercentage: 1.11,
    arbitrageType: 'spot-to-future',
    buyAt: { exchange: 'gateio', price: 0.5924, marketType: 'spot' },
    sellAt: { exchange: 'mexc', price: 0.599, marketType: 'futures' }
  },
  {
    baseSymbol: 'WHITE_USDT',
    profitPercentage: 39.68,
    arbitrageType: 'spot-to-future',
    buyAt: { exchange: 'gateio', price: 0.0003714, marketType: 'spot' },
    sellAt: { exchange: 'mexc', price: 0.0005188, marketType: 'futures' }
  },
  {
    baseSymbol: 'VANRY_USDT',
    profitPercentage: 0.53,
    arbitrageType: 'spot-to-future',
    buyAt: { exchange: 'gateio', price: 0.0339, marketType: 'spot' },
    sellAt: { exchange: 'mexc', price: 0.03408, marketType: 'futures' }
  },
  {
    baseSymbol: 'XEM_USDT',
    profitPercentage: 0.44,
    arbitrageType: 'spot-to-future',
    buyAt: { exchange: 'gateio', price: 0.002745, marketType: 'spot' },
    sellAt: { exchange: 'mexc', price: 0.002757, marketType: 'futures' }
  }
];

// Simular a lógica de filtragem do frontend
function simulateFrontendFiltering(opportunities, minSpread = 0.001, maxOpportunities = 10) {
  console.log(`\n🧪 Simulando filtragem do frontend:`);
  console.log(`   MinSpread: ${minSpread}%`);
  console.log(`   MaxOpportunities: ${maxOpportunities}`);
  console.log(`   Oportunidades recebidas: ${opportunities.length}`);
  
  const filteredOpps = opportunities.filter((opp) => {
    // Validação básica da estrutura da oportunidade
    if (!opp || typeof opp !== 'object' || !opp.buyAt || !opp.sellAt) {
      console.log(`   ❌ ${opp.baseSymbol}: Estrutura inválida`);
      return false;
    }
    
    // Verificar se tem preços válidos
    if (!opp.buyAt.price || !opp.sellAt.price || opp.buyAt.price <= 0 || opp.sellAt.price <= 0) {
      console.log(`   ❌ ${opp.baseSymbol}: Preços inválidos`);
      return false;
    }
    
    const isSpotBuyFuturesSell = opp.buyAt.marketType === 'spot' && opp.sellAt.marketType === 'futures';
    const spread = opp.profitPercentage;
    
    // Verificar se o spread atende ao mínimo configurado
    const meetsMinSpread = spread >= minSpread;
    
    console.log(`   📊 ${opp.baseSymbol}:`);
    console.log(`      ✅ Preços válidos: ${!!opp.buyAt.price && !!opp.sellAt.price}`);
    console.log(`      ✅ Spot→Futures: ${isSpotBuyFuturesSell}`);
    console.log(`      ✅ Spread ≥ ${minSpread}%: ${meetsMinSpread} (${spread}% >= ${minSpread}%)`);
    
    const shouldDisplay = isSpotBuyFuturesSell && meetsMinSpread;
    console.log(`      🎯 Deve aparecer: ${shouldDisplay ? '✅ SIM' : '❌ NÃO'}`);
    
    return shouldDisplay;
  });
  
  console.log(`\n📊 Resultado da filtragem: ${filteredOpps.length} oportunidades válidas`);
  
  // Ordenar por spread decrescente
  const sortedOpps = filteredOpps.sort((a, b) => b.profitPercentage - a.profitPercentage);
  
  // Limitar ao máximo configurado
  const finalOpps = sortedOpps.slice(0, maxOpportunities);
  
  console.log(`\n📋 Lista final ordenada (top ${maxOpportunities}):`);
  finalOpps.forEach((opp, index) => {
    const marker = opp.baseSymbol === 'WHITE_USDT' ? '🎯' : '  ';
    console.log(`   ${marker} ${index + 1}. ${opp.baseSymbol}: ${opp.profitPercentage}%`);
  });
  
  // Verificar se WHITE_USDT está na lista final
  const whiteInFinal = finalOpps.find(opp => opp.baseSymbol === 'WHITE_USDT');
  if (whiteInFinal) {
    const position = finalOpps.indexOf(whiteInFinal) + 1;
    console.log(`\n✅ WHITE_USDT está na posição ${position} da lista final!`);
  } else {
    console.log(`\n❌ WHITE_USDT NÃO está na lista final!`);
    
    // Verificar se estava na lista antes do slice
    const whiteInSorted = sortedOpps.find(opp => opp.baseSymbol === 'WHITE_USDT');
    if (whiteInSorted) {
      const position = sortedOpps.indexOf(whiteInSorted) + 1;
      console.log(`🔍 WHITE_USDT estava na posição ${position} antes do slice (de ${sortedOpps.length} total)`);
      console.log(`🔍 Foi removida pelo limite de ${maxOpportunities} oportunidades`);
    }
  }
  
  return finalOpps;
}

// Executar o teste
const result = simulateFrontendFiltering(mockOpportunities);

console.log('\n✅ Teste concluído!'); 