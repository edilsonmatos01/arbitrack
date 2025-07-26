const WebSocket = require('ws');

console.log('🔍 Testando integração completa do frontend...');

// Simular o estado do React
let positionPriceCache = {};
let livePrices = {};
let opportunities = [];

// Simular posições do banco
const positions = [
  { id: '1', symbol: 'CBK', quantity: 10000, spotEntry: 0.6488, futuresEntry: 0.651, spotExchange: 'gateio', futuresExchange: 'mexc' },
  { id: '2', symbol: 'FARM', quantity: 10000, spotEntry: 28.60, futuresEntry: 28.74, spotExchange: 'gateio', futuresExchange: 'mexc' }
];

// Função para normalizar símbolos (como no frontend)
const normalizeSymbol = (symbol) => {
  return symbol.replace('/', '_').toUpperCase();
};

// Função para atualizar cache (como no frontend)
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

// Função para obter preço em tempo real (como no frontend)
const getLivePriceForPosition = (position, marketType, side = 'buy') => {
  const symbol = position.symbol;
  
  // Primeiro, tentar usar o cache persistente de preços das posições
  const possibleSymbols = [
    symbol.toUpperCase(),
    symbol.replace('/', '_').toUpperCase(),
    symbol.replace('/', '').toUpperCase(),
    normalizeSymbol(symbol),
    normalizeSymbol(symbol.replace('/', '_')),
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
          console.log(`[Position] ✅ Usando cache para ${symbol} ${marketType}: ${price} (idade: ${Math.round(age/1000)}s)`);
          return price;
        }
      }
    }
  }
  
  // Segundo, tentar usar os dados de livePrices
  let liveData = null;
  let foundSymbol = '';

  for (const testSymbol of possibleSymbols) {
    if (livePrices[testSymbol]) {
      liveData = livePrices[testSymbol];
      foundSymbol = testSymbol;
      break;
    }
  }
  
  if (liveData && liveData[marketType]) {
    const price = side === 'buy' ? liveData[marketType].bestAsk : liveData[marketType].bestBid;
    if (price && price > 0) {
      console.log(`[Position] ✅ Usando livePrices para ${symbol} ${marketType}: ${price}`);
      return price;
    }
  }
  
  // Último fallback: usar preços de entrada
  console.log(`[Position] ⚠️ Usando preços de entrada para ${symbol} ${marketType}`);
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

// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'frontend-integration-test',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update') {
      const { symbol, marketType, bestAsk, bestBid } = message;
      
      // Atualizar cache (como o frontend faria)
      updatePositionPriceCache(symbol, marketType, bestAsk, bestBid);
      
      // Atualizar livePrices (como o frontend faria)
      if (!livePrices[symbol]) {
        livePrices[symbol] = {};
      }
      livePrices[symbol][marketType] = {
        bestAsk,
        bestBid,
        timestamp: Date.now()
      };
      
      // Verificar se é um símbolo de posição
      const baseSymbol = symbol.replace('_USDT', '').replace('/USDT', '');
      const position = positions.find(p => p.symbol === baseSymbol);
      
      if (position) {
        console.log(`🎯 [POSIÇÃO] ${baseSymbol} ${marketType}: Ask=${bestAsk}, Bid=${bestBid}`);
        
        // Calcular PnL em tempo real
        const pnl = calculatePnL(position);
        
        console.log(`💰 PnL para ${baseSymbol}:`);
        console.log(`   Spot: ${pnl.spotPnL >= 0 ? '+' : ''}$${pnl.spotPnL.toFixed(2)} (${pnl.pnlSpot >= 0 ? '+' : ''}${pnl.pnlSpot.toFixed(2)}%)`);
        console.log(`   Futures: ${pnl.futuresPnL >= 0 ? '+' : ''}$${pnl.futuresPnL.toFixed(2)} (${pnl.pnlFutures >= 0 ? '+' : ''}${pnl.pnlFutures.toFixed(2)}%)`);
        console.log(`   Total: ${pnl.totalPnL >= 0 ? '+' : ''}$${pnl.totalPnL.toFixed(2)} (${pnl.pnlPercent >= 0 ? '+' : ''}${pnl.pnlPercent.toFixed(2)}%)`);
        console.log(`   Preços atuais: Spot=${pnl.currentSpotPrice}, Futures=${pnl.currentFuturesPrice}`);
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
  
  console.log('\n📊 RESUMO FINAL - Estado do frontend:');
  console.log('\n💾 Cache de preços:');
  for (const [symbol, data] of Object.entries(positionPriceCache)) {
    console.log(`  ${symbol}:`);
    if (data.spot) console.log(`    Spot: Ask=${data.spot.bestAsk}, Bid=${data.spot.bestBid}`);
    if (data.futures) console.log(`    Futures: Ask=${data.futures.bestAsk}, Bid=${data.futures.bestBid}`);
  }
  
  console.log('\n📈 LivePrices:');
  for (const [symbol, data] of Object.entries(livePrices)) {
    console.log(`  ${symbol}:`);
    if (data.spot) console.log(`    Spot: Ask=${data.spot.bestAsk}, Bid=${data.spot.bestBid}`);
    if (data.futures) console.log(`    Futures: Ask=${data.futures.bestAsk}, Bid=${data.futures.bestBid}`);
  }
  
  console.log('\n🧮 PnL final para posições:');
  positions.forEach(position => {
    const pnl = calculatePnL(position);
    console.log(`\n${position.symbol}:`);
    console.log(`  Spot: ${pnl.spotPnL >= 0 ? '+' : ''}$${pnl.spotPnL.toFixed(2)} (${pnl.pnlSpot >= 0 ? '+' : ''}${pnl.pnlSpot.toFixed(2)}%)`);
    console.log(`  Futures: ${pnl.futuresPnL >= 0 ? '+' : ''}$${pnl.futuresPnL.toFixed(2)} (${pnl.pnlFutures >= 0 ? '+' : ''}${pnl.pnlFutures.toFixed(2)}%)`);
    console.log(`  Total: ${pnl.totalPnL >= 0 ? '+' : ''}$${pnl.totalPnL.toFixed(2)} (${pnl.pnlPercent >= 0 ? '+' : ''}${pnl.pnlPercent.toFixed(2)}%)`);
    console.log(`  Preços: Spot=${pnl.currentSpotPrice}, Futures=${pnl.currentFuturesPrice}`);
  });
});

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
  process.exit(0);
}, 20000); 