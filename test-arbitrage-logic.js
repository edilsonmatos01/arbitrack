// Teste simples da lógica de arbitragem
const marketPrices = {
  'gateio': {
    'BTC_USDT': { bestAsk: 50000, bestBid: 49999, timestamp: Date.now() }
  },
  'mexc': {
    'BTC_USDT': { bestAsk: 50100, bestBid: 50099, timestamp: Date.now() }
  }
};

const targetPairs = ['BTC_USDT'];
const MIN_PROFIT_PERCENTAGE = 0.001;

function findAndBroadcastArbitrage() {
  console.log('🔍 Testando lógica de arbitragem...');
  console.log('📊 Dados disponíveis:', Object.keys(marketPrices));
  
  for (const symbol of targetPairs) {
    const gateioData = marketPrices['gateio']?.[symbol];
    const mexcData = marketPrices['mexc']?.[symbol];

    console.log(`📈 ${symbol}:`, {
      gateio: gateioData ? `Ask: ${gateioData.bestAsk}, Bid: ${gateioData.bestBid}` : 'N/A',
      mexc: mexcData ? `Ask: ${mexcData.bestAsk}, Bid: ${mexcData.bestBid}` : 'N/A'
    });

    if (!gateioData || !mexcData) {
      console.log(`❌ Dados insuficientes para ${symbol}`);
      continue;
    }

    // Calcula oportunidades de arbitragem
    const gateioToMexc = ((mexcData.bestBid - gateioData.bestAsk) / gateioData.bestAsk) * 100;
    const mexcToGateio = ((gateioData.bestBid - mexcData.bestAsk) / mexcData.bestAsk) * 100;

    console.log(`💰 Spreads calculados para ${symbol}:`);
    console.log(`  Gate.io → MEXC: ${gateioToMexc.toFixed(4)}%`);
    console.log(`  MEXC → Gate.io: ${mexcToGateio.toFixed(4)}%`);

    // Processa oportunidade Gate.io -> MEXC
    if (gateioToMexc > MIN_PROFIT_PERCENTAGE) {
      console.log(`✅ OPORTUNIDADE Gate.io → MEXC: ${gateioToMexc.toFixed(4)}%`);
    }

    // Processa oportunidade MEXC -> Gate.io
    if (mexcToGateio > MIN_PROFIT_PERCENTAGE) {
      console.log(`✅ OPORTUNIDADE MEXC → Gate.io: ${mexcToGateio.toFixed(4)}%`);
    }
  }
}

// Executar teste
findAndBroadcastArbitrage(); 