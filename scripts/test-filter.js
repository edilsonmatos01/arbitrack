// Teste do filtro da tabela de arbitragem
const minSpread = 0.01; // 0.01%

// Dados reais recebidos do WebSocket
const opportunities = [
  {
    type: 'arbitrage',
    baseSymbol: 'WHITE',
    profitPercentage: 20.582066072364974,
    buyAt: { exchange: 'gateio', price: 0.0003814, marketType: 'spot' },
    sellAt: { exchange: 'mexc', price: 0.0004599, marketType: 'futures' },
    arbitrageType: 'spot_to_futures',
    timestamp: 1753130395764
  },
  {
    type: 'arbitrage',
    baseSymbol: 'HOLD',
    profitPercentage: 1.329864122578777,
    buyAt: { exchange: 'gateio', price: 0.00006918, marketType: 'spot' },
    sellAt: { exchange: 'mexc', price: 0.0000701, marketType: 'futures' },
    arbitrageType: 'spot_to_futures',
    timestamp: 1753130395765
  },
  {
    type: 'arbitrage',
    baseSymbol: 'RBNT',
    profitPercentage: 0.7831968672125239,
    buyAt: { exchange: 'gateio', price: 0.02809, marketType: 'spot' },
    sellAt: { exchange: 'mexc', price: 0.02831, marketType: 'futures' },
    arbitrageType: 'spot_to_futures',
    timestamp: 1753130395765
  },
  {
    type: 'arbitrage',
    baseSymbol: 'B2',
    profitPercentage: 0.025144581342717874,
    buyAt: { exchange: 'gateio', price: 0.3977, marketType: 'spot' },
    sellAt: { exchange: 'mexc', price: 0.3978, marketType: 'futures' },
    arbitrageType: 'spot_to_futures',
    timestamp: 1753130395766
  }
];

console.log('🔍 Testando filtro da tabela...');
console.log('📊 MinSpread configurado:', minSpread + '%');
console.log('📊 Total de oportunidades:', opportunities.length);

const filteredOpps = opportunities.filter((opp) => {
  // Validação básica da estrutura da oportunidade
  if (!opp || typeof opp !== 'object') {
    console.log('❌ Oportunidade inválida (não é objeto)');
    return false;
  }
  
  // Verificar se tem a estrutura básica
  if (!opp.buyAt || !opp.sellAt) {
    console.log('❌ Oportunidade sem buyAt/sellAt');
    return false;
  }
  
  // Verificar se tem preços válidos
  if (!opp.buyAt.price || !opp.sellAt.price || opp.buyAt.price <= 0 || opp.sellAt.price <= 0) {
    console.log('❌ Oportunidade com preços inválidos:', {
      buyPrice: opp.buyAt.price,
      sellPrice: opp.sellAt.price
    });
    return false;
  }
  
  const isSpotBuyFuturesSell = opp.buyAt.marketType === 'spot' && opp.sellAt.marketType === 'futures';
  const spread = opp.profitPercentage; // Usar o spread já calculado
  
  console.log(`📊 ${opp.baseSymbol}:`, {
    isSpotBuyFuturesSell,
    spread: spread + '%',
    minSpread: minSpread + '%',
    isValid: isSpotBuyFuturesSell && spread >= minSpread
  });
  
  // Verificar se o spread atende ao mínimo configurado
  return isSpotBuyFuturesSell && spread >= minSpread;
});

console.log('✅ Oportunidades filtradas:', filteredOpps.length);
filteredOpps.forEach(opp => {
  console.log(`  - ${opp.baseSymbol}: ${opp.profitPercentage.toFixed(4)}%`);
}); 