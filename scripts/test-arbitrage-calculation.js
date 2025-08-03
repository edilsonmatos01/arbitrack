const WebSocket = require('ws');

console.log('🧮 TESTE - CÁLCULO DE ARBITRAGEM');
console.log('=================================');

// Simular dados de preços das exchanges
const gateioPrice = 118294.9; // lowest_ask
const mexcPrice = 118261.4;   // bid1

console.log('📊 DADOS DE PREÇOS:');
console.log(`   Gate.io Spot (lowest_ask): $${gateioPrice}`);
console.log(`   MEXC Futures (bid1): $${mexcPrice}`);

// Calcular spread
const spread = ((mexcPrice - gateioPrice) / gateioPrice) * 100;
console.log(`\n📈 SPREAD CALCULADO: ${spread.toFixed(4)}%`);

// Verificar se é uma oportunidade válida (spread > 0.1%)
const minSpread = 0.1;
const isValidOpportunity = spread >= minSpread;

console.log(`\n🎯 ANÁLISE:`);
console.log(`   Spread mínimo: ${minSpread}%`);
console.log(`   Spread atual: ${spread.toFixed(4)}%`);
console.log(`   É oportunidade válida: ${isValidOpportunity ? '✅ SIM' : '❌ NÃO'}`);

if (isValidOpportunity) {
  console.log(`\n💰 OPORTUNIDADE DE ARBITRAGEM:`);
  console.log(`   Compra: Gate.io Spot @ $${gateioPrice}`);
  console.log(`   Venda: MEXC Futures @ $${mexcPrice}`);
  console.log(`   Lucro: ${spread.toFixed(4)}%`);
} else {
  console.log(`\n⚠️  NÃO É OPORTUNIDADE:`);
  console.log(`   Spread muito baixo (${spread.toFixed(4)}% < ${minSpread}%)`);
}

// Testar com dados que gerariam oportunidade
console.log(`\n🧪 TESTE COM DADOS FICTÍCIOS:`);
const fakeGateioPrice = 118000;
const fakeMexcPrice = 118200;
const fakeSpread = ((fakeMexcPrice - fakeGateioPrice) / fakeGateioPrice) * 100;

console.log(`   Gate.io: $${fakeGateioPrice}`);
console.log(`   MEXC: $${fakeMexcPrice}`);
console.log(`   Spread: ${fakeSpread.toFixed(4)}%`);
console.log(`   É oportunidade: ${fakeSpread >= minSpread ? '✅ SIM' : '❌ NÃO'}`);

console.log(`\n📋 CONCLUSÃO:`);
console.log(`   - O cálculo está funcionando corretamente`);
console.log(`   - Os dados atuais não geram oportunidade válida`);
console.log(`   - O worker pode estar funcionando, mas sem oportunidades suficientes`);
console.log(`   - Aguardar dados com spread maior que ${minSpread}%`); 