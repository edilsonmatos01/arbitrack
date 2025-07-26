const WebSocket = require('ws');
const http = require('http');

// Lista filtrada de pares que funcionam no MEXC Futures
const STATIC_PAIRS = [
  // Símbolos que funcionam no MEXC Futures (testados)
  'SOL_USDT', 'BNB_USDT', 'BCH_USDT', 'XRP_USDT', 'DOGE_USDT', 'FARM_USDT', 'CBK_USDT',
  
  // Símbolos adicionais que podem funcionar (baseado na API REST)
  'ENJ_USDT', 'ALICE_USDT', 'REX_USDT', 'B_USDT', 'RED_USDT', 'RWA_USDT',
  'CESS_USDT', 'TEL_USDT', 'SHM_USDT', 'LABUBU_USDT', 'ZIG_USDT', 'XEM_USDT',
  'LUMIA_USDT', 'PONKE_USDT', 'VANRY_USDT', 'EPIC_USDT', 'CLOUD_USDT', 'DGB_USDT', 'FLM_USDT'
];

const MONITORING_INTERVAL = 5000; // 5 segundos
const RECONNECT_INTERVAL = 5000;
let isShuttingDown = false;

const GATEIO_SPOT_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';

const priceData = {};

// --- WEBSOCKET SERVER ---
const WS_PORT = 10000;
const server = http.createServer();

// Configurar CORS para WebSocket
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false,
  clientTracking: true
});

let connectedClients = [];

wss.on('connection', (ws, request) => {
  console.log(`🔌 Nova conexão WebSocket de ${request.socket.remoteAddress}`);
  connectedClients.push(ws);
  
  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({ 
    type: 'connection', 
    message: 'Conectado ao servidor de arbitragem em tempo real',
    timestamp: new Date().toISOString()
  }));
  
  console.log(`✅ Cliente conectado. Total de clientes: ${connectedClients.length}`);
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Cliente desconectado. Código: ${code}, Razão: ${reason}`);
    connectedClients = connectedClients.filter((c) => c !== ws);
    console.log(`📊 Total de clientes restantes: ${connectedClients.length}`);
  });
  
  ws.on('error', (error) => {
    console.error(`❌ Erro no WebSocket do cliente:`, error);
    connectedClients = connectedClients.filter((c) => c !== ws);
  });
});

server.listen(WS_PORT, () => {
  console.log(`✅ WebSocket server rodando na porta ${WS_PORT}`);
  console.log(`📋 Monitorando ${STATIC_PAIRS.length} símbolos:`, STATIC_PAIRS);
});

function broadcastPriceUpdate(symbol, marketType, bestAsk, bestBid) {
  const message = {
    type: 'price-update',
    symbol: symbol,
    marketType: marketType,
    bestAsk: bestAsk,
    bestBid: bestBid,
    timestamp: Date.now()
  };
  
  console.log(`[Worker] 📤 Enviando price-update: ${symbol} ${marketType} - Ask: ${bestAsk}, Bid: ${bestBid}`);
  
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

function broadcastOpportunity(opportunity) {
  const message = {
    type: 'arbitrage',
    baseSymbol: opportunity.symbol,
    profitPercentage: opportunity.spread,
    buyAt: {
      exchange: 'gateio',
      price: opportunity.spot,
      marketType: 'spot'
    },
    sellAt: {
      exchange: 'mexc',
      price: opportunity.futures,
      marketType: 'futures'
    },
    arbitrageType: 'spot-to-future',
    timestamp: Date.now()
  };
  
  console.log(`[Worker] 🎯 Enviando oportunidade de arbitragem: ${opportunity.symbol} - Spread: ${opportunity.spread.toFixed(4)}%`);
  
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

// Função para calcular e enviar oportunidades de arbitragem
async function monitorAndStore(symbols) {
  console.log(`[Worker] 🔍 Monitorando ${symbols.length} símbolos...`);
  let opportunitiesFound = 0;
  let symbolsWithData = 0;
  
  for (const symbol of symbols) {
    const spot = priceData[symbol]?.spot;
    const futures = priceData[symbol]?.futures;
    
    if (spot && futures && spot > 0 && futures > 0) {
      symbolsWithData++;
      const spread = ((futures - spot) / spot) * 100;
      
      if (spread > 0.1 && spread < 50) {
        console.log(`[OPORTUNIDADE] ${symbol}: Spot=${spot} Futures=${futures} Spread=${spread.toFixed(4)}%`);
        
        // Enviar oportunidade via WebSocket
        broadcastOpportunity({ symbol, spot, futures, spread });
        opportunitiesFound++;
      }
    }
  }
  
  if (opportunitiesFound > 0) {
    console.log(`[Worker] ✅ ${opportunitiesFound} oportunidades enviadas`);
  }
}

// Função para conectar ao Gate.io Spot
function connectGateioSpot(symbols) {
  const ws = new WebSocket(GATEIO_SPOT_WS_URL);
  ws.on('open', () => {
    console.log('[Gate.io Spot] ✅ Conectado!');
    symbols.forEach((symbol) => {
      const msg = {
        id: Date.now(),
        time: Date.now(),
        channel: 'spot.tickers',
        event: 'subscribe',
        payload: [symbol],
      };
      ws.send(JSON.stringify(msg));
    });
    console.log(`[Gate.io Spot] Subscrito a ${symbols.length} símbolos`);
  });
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.channel === 'spot.tickers' && msg.result) {
        const symbol = msg.result.currency_pair;
        const ask = parseFloat(msg.result.lowest_ask);
        const bid = parseFloat(msg.result.highest_bid);
        if (!priceData[symbol]) priceData[symbol] = {};
        priceData[symbol].spot = ask;
        broadcastPriceUpdate(symbol, 'spot', ask, bid);
      }
    } catch (e) {}
  });
  ws.on('close', () => {
    console.log('[Gate.io Spot] 🔌 Conexão fechada');
    if (!isShuttingDown) setTimeout(() => connectGateioSpot(symbols), RECONNECT_INTERVAL);
  });
  ws.on('error', (err) => {
    console.error('[Gate.io Spot] ❌ Erro:', err.message);
  });
}

// Função para conectar ao MEXC Futures
function connectMexcFutures(symbols) {
  const ws = new WebSocket(MEXC_FUTURES_WS_URL);
  ws.on('open', () => {
    console.log('[MEXC Futures] ✅ Conectado!');
    symbols.forEach((symbol) => {
      const msg = {
        method: 'sub.ticker',
        param: { symbol },
      };
      ws.send(JSON.stringify(msg));
    });
    console.log(`[MEXC Futures] Subscrito a ${symbols.length} símbolos`);
  });
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.channel === 'push.ticker' && msg.data && msg.symbol) {
        const symbol = msg.symbol;
        const bid = parseFloat(msg.data.bid1);
        const ask = parseFloat(msg.data.ask1);
        if (!priceData[symbol]) priceData[symbol] = {};
        priceData[symbol].futures = bid;
        broadcastPriceUpdate(symbol, 'futures', ask, bid);
      }
    } catch (e) {}
  });
  ws.on('close', () => {
    console.log('[MEXC Futures] 🔌 Conexão fechada');
    if (!isShuttingDown) setTimeout(() => connectMexcFutures(symbols), RECONNECT_INTERVAL);
  });
  ws.on('error', (err) => {
    console.error('[MEXC Futures] ❌ Erro:', err.message);
  });
}

// Iniciar conexões
console.log('🚀 Iniciando worker...');
connectGateioSpot(STATIC_PAIRS);
connectMexcFutures(STATIC_PAIRS);

// Loop de monitoramento de oportunidades
async function startMonitoring() {
  console.log(`[Worker] 🔄 Iniciando loop de monitoramento (intervalo: ${MONITORING_INTERVAL/1000}s)`);
  
  while (!isShuttingDown) {
    await monitorAndStore(STATIC_PAIRS);
    await new Promise(resolve => setTimeout(resolve, MONITORING_INTERVAL));
  }
}

// Iniciar monitoramento após um pequeno delay para permitir que as conexões sejam estabelecidas
setTimeout(() => {
  startMonitoring();
}, 10000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT, encerrando...');
  isShuttingDown = true;
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM, encerrando...');
  isShuttingDown = true;
  process.exit(0);
}); 