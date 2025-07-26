// Script para testar a lógica de filtragem de oportunidades
console.log('🔍 Testando lógica de filtragem de oportunidades...');

// Simular a função updateOpportunities do hook
function updateOpportunities(prev, newOpportunity, maxOpportunities = 10) {
  console.log(`\n📊 Processando oportunidade: ${newOpportunity.baseSymbol}`);
  console.log(`   Spread: ${newOpportunity.profitPercentage}%`);
  console.log(`   Arbitrage Type: ${newOpportunity.arbitrageType}`);
  
  // Remove se já existe (mesmo baseSymbol e arbitrageType)
  const filtered = prev.filter(
    p => !(p.baseSymbol === newOpportunity.baseSymbol && p.arbitrageType === newOpportunity.arbitrageType)
  );
  
  console.log(`   Oportunidades antes: ${prev.length}`);
  console.log(`   Oportunidades após filtro: ${filtered.length}`);
  
  // Adiciona a nova oportunidade
  const updated = [...filtered, newOpportunity];
  
  // Ordena por spread decrescente
  updated.sort((a, b) => b.profitPercentage - a.profitPercentage);
  
  // Limita ao máximo configurado
  const result = updated.slice(0, maxOpportunities);
  
  console.log(`   Oportunidades finais: ${result.length}`);
  console.log(`   WHITE_USDT na lista: ${result.some(opp => opp.baseSymbol === 'WHITE_USDT')}`);
  
  if (result.some(opp => opp.baseSymbol === 'WHITE_USDT')) {
    const whiteOpp = result.find(opp => opp.baseSymbol === 'WHITE_USDT');
    console.log(`   ✅ WHITE_USDT encontrada com spread: ${whiteOpp.profitPercentage}%`);
  } else {
    console.log(`   ❌ WHITE_USDT não encontrada na lista final`);
  }
  
  return result;
}

// Testar com dados reais
let opportunities = [];

// Adicionar algumas oportunidades
const opportunity1 = {
  baseSymbol: 'VANRY_USDT',
  profitPercentage: 0.5,
  arbitrageType: 'spot-to-future'
};

const opportunity2 = {
  baseSymbol: 'WHITE_USDT',
  profitPercentage: 39.32,
  arbitrageType: 'spot-to-future'
};

const opportunity3 = {
  baseSymbol: 'EPIC_USDT',
  profitPercentage: 0.3,
  arbitrageType: 'spot-to-future'
};

console.log('\n🧪 Teste 1: Adicionando VANRY_USDT');
opportunities = updateOpportunities(opportunities, opportunity1, 10);

console.log('\n🧪 Teste 2: Adicionando WHITE_USDT');
opportunities = updateOpportunities(opportunities, opportunity2, 10);

console.log('\n🧪 Teste 3: Adicionando EPIC_USDT');
opportunities = updateOpportunities(opportunities, opportunity3, 10);

console.log('\n🧪 Teste 4: Atualizando WHITE_USDT (mesmo símbolo e tipo)');
const updatedWhite = {
  baseSymbol: 'WHITE_USDT',
  profitPercentage: 40.5, // Spread maior
  arbitrageType: 'spot-to-future'
};
opportunities = updateOpportunities(opportunities, updatedWhite, 10);

console.log('\n📋 Lista final de oportunidades:');
opportunities.forEach((opp, index) => {
  console.log(`   ${index + 1}. ${opp.baseSymbol}: ${opp.profitPercentage}%`);
});

console.log('\n✅ Teste concluído!'); 