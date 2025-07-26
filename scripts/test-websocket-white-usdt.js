// Teste para simular dados do WebSocket para WHITE_USDT
const WebSocket = require('ws');

console.log('🔍 Testando dados do WebSocket para WHITE_USDT...');

// Simular dados que estão chegando do WebSocket (com baseSymbol = WHITE)
const websocketData = {
  type: 'arbitrage',
  baseSymbol: 'WHITE', // ❌ PROBLEMA: sem _USDT
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

console.log('📊 Dados recebidos do WebSocket:');
console.log(JSON.stringify(websocketData, null, 2));

// Simular o processamento da tabela
const minSpread = 0.01;
const isSpotBuyFuturesSell = websocketData.buyAt.marketType === 'spot' && websocketData.sellAt.marketType === 'futures';
const spread = websocketData.profitPercentage;

console.log('\n📊 Processamento na tabela:');
console.log(`📊 baseSymbol: ${websocketData.baseSymbol}`);
console.log(`📊 isSpotBuyFuturesSell: ${isSpotBuyFuturesSell}`);
console.log(`📊 spread: ${spread}%`);
console.log(`📊 minSpread: ${minSpread}%`);

const isValid = isSpotBuyFuturesSell && spread >= minSpread;
console.log(`📊 isValid: ${isValid}`);

if (isValid) {
  console.log('✅ Passou no filtro da tabela');
  
  // Simular a criação do OpportunityRow
  const opportunity = {
    symbol: websocketData.baseSymbol, // Será 'WHITE' (sem _USDT)
    compraExchange: websocketData.buyAt.exchange,
    compraPreco: websocketData.buyAt.price,
    vendaExchange: websocketData.sellAt.exchange,
    vendaPreco: websocketData.sellAt.price,
    spread: websocketData.profitPercentage,
    tipo: 'inter',
    directionApi: websocketData.arbitrageType.includes('spot_to_futures') ? 'SPOT_TO_FUTURES' : 'FUTURES_TO_SPOT',
    maxSpread24h: null,
    buyAtMarketType: websocketData.buyAt.marketType,
    sellAtMarketType: websocketData.sellAt.marketType,
  };
  
  console.log('\n📊 Opportunity criada:');
  console.log(`📊 symbol: ${opportunity.symbol}`);
  console.log(`📊 spread: ${opportunity.spread}%`);
  
  // Verificar se o InstantMaxSpreadCell conseguirá encontrar dados
  console.log('\n📊 Testando InstantMaxSpreadCell:');
  console.log(`📊 Buscando dados para symbol: ${opportunity.symbol}`);
  
  // Simular busca na API
  const apiSymbol = opportunity.symbol + '_USDT'; // Adicionar _USDT para buscar na API
  console.log(`📊 Símbolo para API: ${apiSymbol}`);
  
  // Verificar se está na lista de pares monitorados
  const monitoredPairs = [
    'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 
    'ALCX_USDT', 'GORK_USDT', 'ALPINE_USDT', 'CITY_USDT', 'ILV_USDT'
  ];
  
  const isMonitored = monitoredPairs.includes(apiSymbol);
  console.log(`📊 ${apiSymbol} está na lista: ${isMonitored}`);
  
  if (isMonitored) {
    console.log('✅ InstantMaxSpreadCell conseguirá carregar os dados');
    console.log('✅ WHITE_USDT deve aparecer na tabela com spread máximo');
  } else {
    console.log('❌ InstantMaxSpreadCell não conseguirá carregar os dados');
    console.log('❌ Mostrará "N/D Sem dados" na coluna Spread Máximo');
  }
  
} else {
  console.log('❌ Não passou no filtro da tabela');
  console.log('❌ Não aparecerá na interface');
}

console.log('\n🔧 SOLUÇÃO:');
console.log('🔧 O worker deve enviar baseSymbol: "WHITE_USDT" (com _USDT)');
console.log('🔧 Em vez de baseSymbol: "WHITE" (sem _USDT)'); 