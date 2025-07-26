const WebSocket = require('ws');

console.log('🔍 Testando renderização React dos cards...');

// Simular o estado do React
let positionPriceCache = {};
let livePrices = {};
let positions = [
  { id: '1', symbol: 'CBK', quantity: 10000, spotEntry: 0.6488, futuresEntry: 0.651, spotExchange: 'gateio', futuresExchange: 'mexc' },
  { id: '2', symbol: 'FARM', quantity: 10000, spotEntry: 28.60, futuresEntry: 28.74, spotExchange: 'gateio', futuresExchange: 'mexc' }
];

// Simular useEffect para atualizar cache quando livePrices mudar
const updatePositionPriceCache = (symbol, marketType, bestAsk, bestBid) => {
  if (!positionPriceCache[symbol]) {
    positionPriceCache[symbol] = {};
  }
  positionPriceCache[symbol][marketType] = {
    bestAsk,
    bestBid,
    timestamp: Date.now()
  };
  console.log(`💾 Cache atualizado: ${symbol} ${marketType} - Ask: ${bestAsk}, Bid: ${bestBid}`);
};

// Simular useEffect que atualiza cache quando recebe dados de livePrices
const processLivePrices = (livePrices) => {
  Object.entries(livePrices).forEach(([symbol, data]) => {
    if (data.spot) {
      updatePositionPriceCache(symbol, 'spot', data.spot.bestAsk, data.spot.bestBid);
    }
    if (data.futures) {
      updatePositionPriceCache(symbol, 'futures', data.futures.bestAsk, data.futures.bestBid);
    }
  });
};

// Função para obter preço em tempo real (como no frontend)
const getLivePriceForPosition = (position, marketType, side = 'buy') => {
  const symbol = position.symbol;
  
  const possibleSymbols = [
    symbol.toUpperCase(),
    symbol.replace('/', '_').toUpperCase(),
    symbol.replace('/', '').toUpperCase(),
    `${symbol.toUpperCase()}_USDT`,
    `${symbol.replace('/', '_').toUpperCase()}_USDT`,
  ];

  // Procura no cache de preços das posições
  for (const testSymbol of possibleSymbols) {
    if (positionPriceCache[testSymbol] && positionPriceCache[testSymbol][marketType]) {
      const cachedData = positionPriceCache[testSymbol][marketType];
      const price = side === 'buy' ? cachedData.bestAsk : cachedData.bestBid;
      if (price && price > 0) {
        const age = Date.now() - cachedData.timestamp;
        if (age < 60000) {
          return price;
        }
      }
    }
  }
  
  // Segundo, tentar usar os dados de livePrices
  for (const testSymbol of possibleSymbols) {
    if (livePrices[testSymbol] && livePrices[testSymbol][marketType]) {
      const price = side === 'buy' ? livePrices[testSymbol][marketType].bestAsk : livePrices[testSymbol][marketType].bestBid;
      if (price && price > 0) {
        return price;
      }
    }
  }
  
  // Último fallback: usar preços de entrada
  return marketType === 'spot' ? position.spotEntry : position.futuresEntry;
};

// Função para calcular PnL (como no frontend)
const calculatePnL = (position) => {
  const currentSpotPrice = getLivePriceForPosition(position, 'spot', 'sell');
  const currentFuturesPrice = getLivePriceForPosition(position, 'futures', 'buy');
  
  const spotPnL = (currentSpotPrice - position.spotEntry) * position.quantity;
  const futuresPnL = (position.futuresEntry - currentFuturesPrice) * position.quantity;
  const totalPnL = spotPnL + futuresPnL;
  
  const pnlSpot = position.spotEntry > 0 ? ((currentSpotPrice - position.spotEntry) / position.spotEntry) * 100 : 0;
  const pnlFutures = position.futuresEntry > 0 ? ((position.futuresEntry - currentFuturesPrice) / position.futuresEntry) * 100 : 0;
  const pnlPercent = pnlSpot + pnlFutures;
  
  return {
    spotPnL,
    futuresPnL,
    totalPnL,
    pnlSpot,
    pnlFutures,
    pnlPercent,
    currentSpotPrice,
    currentFuturesPrice
  };
};

// Função para renderizar card (simulação)
const renderPositionCard = (position) => {
  const pnl = calculatePnL(position);
  const hasLiveData = positionPriceCache[position.symbol] || livePrices[position.symbol];
  
  console.log(`\n🎴 CARD ${position.symbol}:`);
  console.log(`   Status: ${hasLiveData ? 'TEMPO REAL' : 'CACHE'}`);
  console.log(`   Preços: Spot=${pnl.currentSpotPrice}, Futures=${pnl.currentFuturesPrice}`);
  console.log(`   PnL Spot: ${pnl.spotPnL >= 0 ? '+' : ''}$${pnl.spotPnL.toFixed(2)} (${pnl.pnlSpot >= 0 ? '+' : ''}${pnl.pnlSpot.toFixed(2)}%)`);
  console.log(`   PnL Futures: ${pnl.futuresPnL >= 0 ? '+' : ''}$${pnl.futuresPnL.toFixed(2)} (${pnl.pnlFutures >= 0 ? '+' : ''}${pnl.pnlFutures.toFixed(2)}%)`);
  console.log(`   PnL Total: ${pnl.totalPnL >= 0 ? '+' : ''}$${pnl.totalPnL.toFixed(2)} (${pnl.pnlPercent >= 0 ? '+' : ''}${pnl.pnlPercent.toFixed(2)}%)`);
};

// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'react-rendering-test',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update') {
      const { symbol, marketType, bestAsk, bestBid } = message;
      
      // Atualizar livePrices (como o React faria)
      if (!livePrices[symbol]) {
        livePrices[symbol] = {};
      }
      livePrices[symbol][marketType] = {
        bestAsk,
        bestBid,
        timestamp: Date.now()
      };
      
      // Processar livePrices (como o useEffect faria)
      processLivePrices(livePrices);
      
      // Verificar se é um símbolo de posição
      const baseSymbol = symbol.replace('_USDT', '').replace('/USDT', '');
      const position = positions.find(p => p.symbol === baseSymbol);
      
      if (position) {
        console.log(`\n🎯 [POSIÇÃO] ${baseSymbol} ${marketType}: Ask=${bestAsk}, Bid=${bestBid}`);
        
        // Renderizar card atualizado
        renderPositionCard(position);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro WebSocket:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Conexão fechada: ${code} - ${reason}`);
  
  console.log('\n📊 RESUMO FINAL - Renderização dos cards:');
  positions.forEach(position => {
    renderPositionCard(position);
  });
  
  console.log('\n💾 Estado final do cache:');
  for (const [symbol, data] of Object.entries(positionPriceCache)) {
    console.log(`  ${symbol}:`);
    if (data.spot) console.log(`    Spot: Ask=${data.spot.bestAsk}, Bid=${data.spot.bestBid}`);
    if (data.futures) console.log(`    Futures: Ask=${data.futures.bestAsk}, Bid=${data.futures.bestBid}`);
  }
});

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
  process.exit(0);
}, 15000); 