const fs = require('fs');
const path = require('path');

// Simular dados de oportunidades para testar filtros
const mockOpportunities = [
  {
    baseSymbol: "BTC_USDT",
    buyAt: {
      exchange: "gateio",
      price: 50000,
      marketType: "spot"
    },
    sellAt: {
      exchange: "mexc",
      price: 50250,
      marketType: "futures"
    },
    arbitrageType: "spot_to_futures",
    timestamp: Date.now()
  },
  {
    baseSymbol: "ETH_USDT",
    buyAt: {
      exchange: "gateio",
      price: 3000,
      marketType: "spot"
    },
    sellAt: {
      exchange: "mexc",
      price: 3015,
      marketType: "futures"
    },
    arbitrageType: "spot_to_futures",
    timestamp: Date.now()
  },
  {
    baseSymbol: "INVALID_PAIR",
    buyAt: {
      exchange: "gateio",
      price: 100,
      marketType: "spot"
    },
    sellAt: {
      exchange: "mexc",
      price: 101,
      marketType: "futures"
    },
    arbitrageType: "spot_to_futures",
    timestamp: Date.now()
  },
  {
    baseSymbol: "SOL_USDT",
    buyAt: {
      exchange: "gateio",
      price: 50,
      marketType: "futures" // INVÁLIDO - deveria ser spot
    },
    sellAt: {
      exchange: "mexc",
      price: 51,
      marketType: "spot" // INVÁLIDO - deveria ser futures
    },
    arbitrageType: "spot_to_futures",
    timestamp: Date.now()
  }
];

// Constantes do filtro
const BIG_ARB_PAIRS = [
  "BTC_USDT", "ETH_USDT", "SOL_USDT", "BNB_USDT", "XRP_USDT",
  "LINK_USDT", "AAVE_USDT", "APT_USDT", "SUI_USDT", "NEAR_USDT", "ONDO_USDT"
];

// Função para testar filtros
function testFilters(opportunities, isBigArb = false, minSpread = 0.1) {
  console.log('=== TESTE DE FILTROS ===');
  console.log(`Configurações: isBigArb=${isBigArb}, minSpread=${minSpread}%`);
  console.log(`Total de oportunidades: ${opportunities.length}`);
  console.log('');

  const filteredOpps = opportunities.filter((opp) => {
    // Validação básica da estrutura da oportunidade
    if (!opp || typeof opp !== 'object') {
      console.log(`❌ Oportunidade inválida:`, opp);
      return false;
    }
    
    const isSpotBuyFuturesSell = opp.buyAt && opp.sellAt && 
      opp.buyAt.marketType === 'spot' && opp.sellAt.marketType === 'futures';
    
    const spread = opp.buyAt && opp.sellAt ? 
      ((opp.sellAt.price - opp.buyAt.price) / opp.buyAt.price) * 100 : 0;
    
    console.log(`\n📊 Analisando ${opp.baseSymbol}:`);
    console.log(`  - Estrutura válida: ${!!opp && typeof opp === 'object'}`);
    console.log(`  - buyAt válido: ${!!opp.buyAt}`);
    console.log(`  - sellAt válido: ${!!opp.sellAt}`);
    console.log(`  - buyAt.marketType: ${opp.buyAt?.marketType}`);
    console.log(`  - sellAt.marketType: ${opp.sellAt?.marketType}`);
    console.log(`  - isSpotBuyFuturesSell: ${isSpotBuyFuturesSell}`);
    console.log(`  - Spread: ${spread.toFixed(2)}%`);
    console.log(`  - baseSymbol: ${opp.baseSymbol}`);
    console.log(`  - Está em BIG_ARB_PAIRS: ${BIG_ARB_PAIRS.includes(opp.baseSymbol)}`);
    
    if (isBigArb) {
      const isValidBigArb = isSpotBuyFuturesSell && opp.baseSymbol && BIG_ARB_PAIRS.includes(opp.baseSymbol);
      console.log(`  - BigArb válida: ${isValidBigArb}`);
      return isValidBigArb;
    }
    
    const isValidRegular = isSpotBuyFuturesSell && spread >= minSpread;
    console.log(`  - Oportunidade regular válida: ${isValidRegular}`);
    return isValidRegular;
  });

  console.log(`\n✅ Resultado: ${filteredOpps.length} oportunidades após filtro`);
  
  const sortedOpps = filteredOpps.sort((a, b) => {
    const spreadA = a.buyAt && a.sellAt ? ((a.sellAt.price - a.buyAt.price) / a.buyAt.price) * 100 : 0;
    const spreadB = b.buyAt && b.sellAt ? ((b.sellAt.price - b.buyAt.price) / b.buyAt.price) * 100 : 0;
    return spreadB - spreadA;
  });

  console.log(`📈 Ordenação: ${sortedOpps.length} oportunidades ordenadas por spread`);
  
  return sortedOpps;
}

// Testar filtros regulares
console.log('\n🔍 TESTE 1: Filtros Regulares (isBigArb=false, minSpread=0.1%)');
const regularResults = testFilters(mockOpportunities, false, 0.1);

// Testar filtros BigArb
console.log('\n🔍 TESTE 2: Filtros BigArb (isBigArb=true)');
const bigArbResults = testFilters(mockOpportunities, true, 0.1);

// Testar com spread mínimo maior
console.log('\n🔍 TESTE 3: Filtros com Spread Mínimo Alto (minSpread=1%)');
const highSpreadResults = testFilters(mockOpportunities, false, 1.0);

console.log('\n=== RESUMO DOS TESTES ===');
console.log(`Filtros regulares: ${regularResults.length} oportunidades`);
console.log(`Filtros BigArb: ${bigArbResults.length} oportunidades`);
console.log(`Filtros com spread alto: ${highSpreadResults.length} oportunidades`);

// Verificar se há problemas com dados reais
console.log('\n=== VERIFICAÇÃO DE DADOS REAIS ===');
console.log('Para verificar dados reais, execute:');
console.log('node scripts/test-websocket-data.js'); 