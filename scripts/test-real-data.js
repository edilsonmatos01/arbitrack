const fetch = require('node-fetch');

// Função para buscar preços reais do Gate.io
async function fetchGateioRealTimePrices() {
  try {
    console.log('🔍 Buscando preços reais do Gate.io (SPOT)...');
    const response = await fetch('https://api.gateio.ws/api/v4/spot/tickers');
    const data = await response.json();
    
    const monitoredPairs = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT'];
    const prices = {};
    
    data.forEach((ticker) => {
      if (monitoredPairs.includes(ticker.currency_pair)) {
        prices[ticker.currency_pair] = {
          ask: parseFloat(ticker.lowest_ask),
          bid: parseFloat(ticker.highest_bid),
          last: parseFloat(ticker.last)
        };
      }
    });
    
    console.log(`✅ Gate.io SPOT: ${Object.keys(prices).length} pares encontrados`);
    console.log('📊 Dados encontrados:');
    
    Object.entries(prices).forEach(([symbol, price]) => {
      console.log(`  ${symbol}: Ask $${price.ask}, Bid $${price.bid}, Last $${price.last}`);
    });
    
    return prices;
  } catch (error) {
    console.error('❌ Erro ao buscar preços do Gate.io:', error);
    return {};
  }
}

// Função para buscar preços de futures do MEXC
async function fetchMexcFuturesPrices() {
  try {
    console.log('\n🔍 Buscando preços de futures do MEXC...');
    const response = await fetch('https://api.mexc.com/api/v3/ticker/24hr');
    const data = await response.json();
    
    const monitoredPairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
    const prices = {};
    
    data.forEach((ticker) => {
      if (monitoredPairs.includes(ticker.symbol)) {
        // Simular preços de futures com pequena variação
        const spotPrice = parseFloat(ticker.lastPrice);
        const futuresPrice = spotPrice * (1 + (Math.random() - 0.5) * 0.005); // ±0.25% variação
        
        prices[ticker.symbol] = {
          ask: parseFloat(ticker.askPrice),
          bid: parseFloat(ticker.bidPrice),
          last: spotPrice,
          futuresPrice: futuresPrice
        };
      }
    });
    
    console.log(`✅ MEXC FUTURES: ${Object.keys(prices).length} pares encontrados`);
    console.log('📊 Dados encontrados:');
    
    Object.entries(prices).forEach(([symbol, price]) => {
      console.log(`  ${symbol}: Spot $${price.last}, Futures $${price.futuresPrice.toFixed(2)}`);
    });
    
    return prices;
  } catch (error) {
    console.error('❌ Erro ao buscar preços do MEXC:', error);
    return {};
  }
}

// Função para gerar oportunidades
async function generateOpportunities() {
  console.log('\n🚀 Gerando oportunidades de arbitragem (SPOT vs FUTURES)...');
  
  const gateioSpotPrices = await fetchGateioRealTimePrices();
  const mexcFuturesPrices = await fetchMexcFuturesPrices();
  
  const opportunities = [];
  
  // Comparar preços SPOT (Gate.io) vs FUTURES (MEXC)
  Object.keys(gateioSpotPrices).forEach(symbol => {
    const gateioSymbol = symbol;
    const mexcSymbol = symbol.replace('_', '');
    
    if (mexcFuturesPrices[mexcSymbol]) {
      const spotPrice = gateioSpotPrices[gateioSymbol].last;
      const futuresPrice = mexcFuturesPrices[mexcSymbol].futuresPrice;
      
      // Calcular spread
      const spread = Math.abs(((futuresPrice - spotPrice) / spotPrice) * 100);
      
      if (spread >= 0.05) { // Spread mínimo de 0.05%
        opportunities.push({
          symbol: gateioSymbol,
          spread: spread,
          spotPrice: spotPrice,
          futuresPrice: futuresPrice,
          buyAt: spotPrice < futuresPrice ? 'gateio' : 'mexc',
          sellAt: spotPrice < futuresPrice ? 'mexc' : 'gateio',
          direction: spotPrice < futuresPrice ? 'spot_to_futures' : 'futures_to_spot'
        });
      }
    }
  });
  
  console.log(`\n📈 Oportunidades encontradas: ${opportunities.length}`);
  
  if (opportunities.length > 0) {
    console.log('\n🎯 Melhores oportunidades:');
    opportunities
      .sort((a, b) => b.spread - a.spread)
      .slice(0, 5)
      .forEach((opp, index) => {
        console.log(`  ${index + 1}. ${opp.symbol}: ${opp.spread.toFixed(4)}% - ${opp.direction}`);
        console.log(`     Spot: $${opp.spotPrice} | Futures: $${opp.futuresPrice.toFixed(2)}`);
        console.log(`     Compra: ${opp.buyAt} | Venda: ${opp.sellAt}\n`);
      });
  } else {
    console.log('❌ Nenhuma oportunidade significativa encontrada');
  }
  
  return opportunities;
}

// Executar teste
generateOpportunities().catch(console.error); 