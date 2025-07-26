const WebSocket = require('ws');

console.log('🔍 Testando WebSocket do frontend...');

// Simular o comportamento do hook useArbitrageWebSocket
const positionPriceCache = new Map();
const updatePositionPriceCache = (symbol, marketType, price) => {
  const key = `${symbol}_${marketType}`;
  positionPriceCache.set(key, {
    price,
    timestamp: Date.now()
  });
  console.log(`💾 Cache atualizado: ${key} = ${price}`);
};

// Símbolos das posições (como estão no banco)
const positionSymbols = ['CBK', 'FARM'];

// Função para normalizar símbolos (como no frontend)
const normalizeSymbol = (symbol) => {
  return symbol.replace('/', '_').toUpperCase();
};

// Função para obter preço em tempo real (como no frontend)
const getLivePriceForPosition = (symbol, marketType) => {
  // Tentar diferentes formatos de símbolo
  const possibleSymbols = [
    symbol.toUpperCase(),
    symbol.replace('/', '_').toUpperCase(),
    symbol.replace('/', '').toUpperCase(),
    normalizeSymbol(symbol),
    normalizeSymbol(symbol.replace('/', '_')),
    `${symbol.toUpperCase()}_USDT`,
    `${symbol.toUpperCase()}/USDT`
  ];

  console.log(`🔍 Procurando preço para ${symbol} (${marketType})`);
  console.log(`📋 Símbolos possíveis:`, possibleSymbols);

  for (const testSymbol of possibleSymbols) {
    const key = `${testSymbol}_${marketType}`;
    const cached = positionPriceCache.get(key);
    if (cached) {
      console.log(`✅ Preço encontrado: ${key} = ${cached.price}`);
      return cached.price;
    }
  }

  console.log(`❌ Preço não encontrado para ${symbol} (${marketType})`);
  return null;
};

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  
  // Enviar mensagem de identificação
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'frontend-test',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update') {
      const { symbol, marketType, bestAsk, bestBid } = message;
      
      // Atualizar cache (como o frontend faria)
      updatePositionPriceCache(symbol, marketType, bestBid);
      
      // Verificar se é um símbolo de posição
      const baseSymbol = symbol.replace('_USDT', '').replace('/USDT', '');
      if (positionSymbols.includes(baseSymbol)) {
        console.log(`🎯 [POSIÇÃO] ${baseSymbol} ${marketType}: Ask=${bestAsk}, Bid=${bestBid}`);
        
        // Testar se conseguimos obter o preço
        const livePrice = getLivePriceForPosition(baseSymbol, marketType);
        if (livePrice) {
          console.log(`✅ Preço obtido para ${baseSymbol} ${marketType}: ${livePrice}`);
        } else {
          console.log(`❌ Falha ao obter preço para ${baseSymbol} ${marketType}`);
        }
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
  
  console.log('\n📊 RESUMO FINAL - Cache de preços:');
  for (const [key, value] of positionPriceCache.entries()) {
    console.log(`  ${key}: ${value.price} (${new Date(value.timestamp).toLocaleTimeString()})`);
  }
  
  // Testar obtenção de preços para todas as posições
  console.log('\n🧪 Testando obtenção de preços para posições:');
  positionSymbols.forEach(symbol => {
    ['spot', 'futures'].forEach(marketType => {
      const price = getLivePriceForPosition(symbol, marketType);
      if (price) {
        console.log(`✅ ${symbol} ${marketType}: ${price}`);
      } else {
        console.log(`❌ ${symbol} ${marketType}: N/A`);
      }
    });
  });
});

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
  process.exit(0);
}, 15000); 