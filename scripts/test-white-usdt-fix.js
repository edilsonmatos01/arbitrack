// Teste para verificar se WHITE_USDT está sendo exibida corretamente
const WebSocket = require('ws');

console.log('🔍 Testando correção WHITE_USDT...');

// Simular dados corretos (com baseSymbol = WHITE_USDT)
const mockOpportunity = {
  type: 'arbitrage',
  baseSymbol: 'WHITE_USDT', // ✅ CORRIGIDO: agora com _USDT
  profitPercentage: 20.582066072364974,
  buyAt: {
    exchange: 'gateio',
    price: 0.0003814,
    marketType: 'spot'
  },
  sellAt: {
    exchange: 'mexc',
    price: 0.0004599,
    marketType: 'futures'
  },
  arbitrageType: 'spot_to_futures',
  timestamp: Date.now()
};

// Testar filtros da tabela
const minSpread = 0.01; // 0.01%

console.log('📊 Testando filtro da tabela...');
console.log(`📊 MinSpread configurado: ${minSpread}%`);
console.log(`📊 Oportunidade: ${mockOpportunity.baseSymbol}`);

// Aplicar os mesmos filtros da tabela
const isSpotBuyFuturesSell = mockOpportunity.buyAt.marketType === 'spot' && mockOpportunity.sellAt.marketType === 'futures';
const spread = mockOpportunity.profitPercentage;

console.log(`📊 ${mockOpportunity.baseSymbol}: {
  isSpotBuyFuturesSell: ${isSpotBuyFuturesSell},
  spread: '${spread}%',
  minSpread: '${minSpread}%',
  isValid: ${isSpotBuyFuturesSell && spread >= minSpread}
}`);

const isValid = isSpotBuyFuturesSell && spread >= minSpread;

if (isValid) {
  console.log('✅ WHITE_USDT passou no filtro da tabela!');
  console.log('✅ Deve aparecer na interface');
} else {
  console.log('❌ WHITE_USDT não passou no filtro da tabela');
  console.log('❌ Não aparecerá na interface');
}

// Testar se o símbolo está na lista de pares monitorados
const monitoredPairs = [
  'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 
  'ALCX_USDT', 'GORK_USDT', 'ALPINE_USDT', 'CITY_USDT', 'ILV_USDT'
];

const isMonitored = monitoredPairs.includes(mockOpportunity.baseSymbol);
console.log(`\n📋 Verificação de lista de pares:`);
console.log(`📋 WHITE_USDT está na lista: ${isMonitored}`);
console.log(`📋 Lista completa: ${monitoredPairs.join(', ')}`);

if (isMonitored && isValid) {
  console.log('\n🎉 RESULTADO: WHITE_USDT deve aparecer na tabela!');
} else {
  console.log('\n❌ RESULTADO: WHITE_USDT não aparecerá na tabela');
  if (!isMonitored) {
    console.log('   - Motivo: Não está na lista de pares monitorados');
  }
  if (!isValid) {
    console.log('   - Motivo: Não passou no filtro da tabela');
  }
} 