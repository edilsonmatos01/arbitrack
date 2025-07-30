// Simular a lógica de matching de símbolos do frontend
function normalizeSymbol(symbol) {
  return symbol.replace('/', '_').toUpperCase();
}

function getLivePriceForPosition(symbol, livePrices, marketType, side = 'buy') {
  // Tenta diferentes formatos do símbolo, todos em uppercase
  const possibleSymbols = [
    symbol.toUpperCase(),
    symbol.replace('/', '_').toUpperCase(),
    symbol.replace('/', '').toUpperCase(),
    normalizeSymbol(symbol),
    normalizeSymbol(symbol.replace('/', '_')),
  ];

  console.log(`🔍 Procurando por: ${symbol}`);
  console.log(`📋 Formatos tentados:`, possibleSymbols);

  let liveData = null;
  let foundSymbol = '';

  // Procura pelos diferentes formatos
  for (const testSymbol of possibleSymbols) {
    if (livePrices[testSymbol]) {
      liveData = livePrices[testSymbol];
      foundSymbol = testSymbol;
      console.log(`✅ Encontrado com formato: ${testSymbol}`);
      break;
    }
  }
  
  if (!liveData) {
    console.log(`❌ Nenhum preço encontrado para ${symbol}`);
    console.log(`📊 Preços disponíveis:`, Object.keys(livePrices));
    return null;
  }
  
  if (liveData[marketType]) {
    const price = side === 'buy' ? liveData[marketType].bestAsk : liveData[marketType].bestBid;
    console.log(`✅ Preço encontrado para ${symbol} (${marketType}): ${price}`);
    return price;
  }
  
  console.log(`⚠️ Dados encontrados mas sem ${marketType} para ${symbol}:`, liveData);
  return null;
}

// Simular dados de livePrices (como recebidos do WebSocket)
const livePrices = {
  'PIN_USDT': {
    'spot': { bestAsk: 0.8214, bestBid: 0.8168 },
    'futures': { bestAsk: 0.827, bestBid: 0.824 }
  },
  'DODO_USDT': {
    'spot': { bestAsk: 0.0497, bestBid: 0.0496 },
    'futures': { bestAsk: 0.0497, bestBid: 0.04969 }
  }
};

console.log('🧪 Testando matching de símbolos...\n');

// Teste 1: PIN_USDT
console.log('=== TESTE 1: PIN_USDT ===');
getLivePriceForPosition('PIN_USDT', livePrices, 'spot', 'sell');
getLivePriceForPosition('PIN_USDT', livePrices, 'futures', 'buy');
console.log('');

// Teste 2: PIN/USDT (formato com barra)
console.log('=== TESTE 2: PIN/USDT ===');
getLivePriceForPosition('PIN/USDT', livePrices, 'spot', 'sell');
getLivePriceForPosition('PIN/USDT', livePrices, 'futures', 'buy');
console.log('');

// Teste 3: pin_usdt (lowercase)
console.log('=== TESTE 3: pin_usdt ===');
getLivePriceForPosition('pin_usdt', livePrices, 'spot', 'sell');
getLivePriceForPosition('pin_usdt', livePrices, 'futures', 'buy');
console.log('');

console.log('✅ Teste concluído!'); 