// WORKER DE TESTE COM POUCOS SÍMBOLOS
const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');
const http = require('http');

// Configurações
const MONITORING_INTERVAL = 1000; // 1 segundo para testes
const RECONNECT_INTERVAL = 5000;
const WS_SERVER_PORT = 10000;

let isWorkerRunning = false;
let isShuttingDown = false;
let prisma = null;

// Servidor WebSocket
let wss = null;
let connectedClients = [];

// Armazenamento de preços
const priceData = {
  'gateio_spot': {},
  'mexc_futures': {}
};

// URLs WebSocket
const GATEIO_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';

// Apenas alguns símbolos para teste
const TEST_SYMBOLS = [
  { baseSymbol: 'BTC', gateioSymbol: 'BTC_USDT', mexcFuturesSymbol: 'BTC_USDT' },
  { baseSymbol: 'ETH', gateioSymbol: 'ETH_USDT', mexcFuturesSymbol: 'ETH_USDT' },
  { baseSymbol: 'DODO', gateioSymbol: 'DODO_USDT', mexcFuturesSymbol: 'DODO_USDT' }
];

// Mensagens de subscrição
const SUBSCRIPTION_MESSAGES = {
  'Gate.io Spot': (symbol) => ({
    id: Date.now(),
    time: Date.now(),
    channel: "spot.tickers",
    event: "subscribe",
    payload: [symbol]
  }),
  'MEXC Futures': (symbol) => ({
    method: "sub.ticker",
    param: { symbol: symbol.toLowerCase().replace('_', '_') }
  })
};

function normalizeSymbol(symbol) {
  return symbol.replace('-', '_').toUpperCase();
}

function processWebSocketMessage(exchange, message) {
  if (!message || typeof message !== 'object') return;
  
  try {
    let symbol = '';
    let bestAsk = 0;
    let bestBid = 0;

    // Gate.io Spot
    if (exchange === 'Gate.io Spot' && message.channel === 'spot.tickers' && message.result) {
      symbol = message.result.currency_pair;
      bestAsk = parseFloat(message.result.lowest_ask);
      bestBid = parseFloat(message.result.highest_bid);
      
      if (symbol && bestAsk > 0 && bestBid > 0) {
        const normSymbol = normalizeSymbol(symbol);
        priceData['gateio_spot'][normSymbol] = {
          bestAsk,
          bestBid,
          timestamp: Date.now()
        };
        console.log(`[LOG] ${exchange} ${normSymbol}: Ask=${bestAsk}, Bid=${bestBid}`);
      }
    }
    
    // MEXC Futures
    else if (exchange === 'MEXC Futures' && message.channel === 'push.ticker' && message.data) {
      symbol = message.symbol;
      bestAsk = parseFloat(message.data.ask1);
      bestBid = parseFloat(message.data.bid1);
      
      if (symbol && bestAsk > 0 && bestBid > 0) {
        const normSymbol = normalizeSymbol(symbol);
        priceData['mexc_futures'][normSymbol] = {
          bestAsk,
          bestBid,
          timestamp: Date.now()
        };
        console.log(`[LOG] ${exchange} ${normSymbol}: Ask=${bestAsk}, Bid=${bestBid}`);
      }
    }
  } catch (error) {
    console.error(`[${exchange}] Erro ao processar mensagem:`, error);
  }
}

function calculateArbitrageOpportunities() {
  const opportunities = [];
  const symbols = Object.keys(priceData['gateio_spot']);

  console.log(`[Worker] Calculando oportunidades: Gate.io SPOT → MEXC FUTURES`);

  for (const symbol of symbols) {
    try {
      const gateioSpot = priceData['gateio_spot'][symbol];
      const mexcFutures = priceData['mexc_futures'][symbol];

      if (!gateioSpot || !mexcFutures) {
        console.log(`[Worker] Dados insuficientes para ${symbol}: Gate.io=${!!gateioSpot}, MEXC=${!!mexcFutures}`);
        continue;
      }

      const spotPrice = gateioSpot.bestAsk;
      const futuresPrice = mexcFutures.bestBid;
      
      if (spotPrice > 0 && futuresPrice > 0) {
        const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
        
        console.log(`[Worker] ${symbol}: Spot=${spotPrice}, Futures=${futuresPrice}, Spread=${spread.toFixed(4)}%`);
        
        if (spread >= 0.01 && spread <= 50) {
          const opportunity = {
            type: 'arbitrage',
            baseSymbol: symbol.replace('_USDT', ''),
            profitPercentage: spread,
            buyAt: {
              exchange: 'gateio',
              price: spotPrice,
              marketType: 'spot'
            },
            sellAt: {
              exchange: 'mexc',
              price: futuresPrice,
              marketType: 'futures'
            },
            arbitrageType: 'spot_to_futures',
            timestamp: Date.now()
          };
          
          opportunities.push(opportunity);
          console.log(`[Worker] ✅ OPORTUNIDADE: ${symbol} - ${spread.toFixed(4)}%`);
        }
      }
    } catch (error) {
      console.error(`[Worker] Erro ao calcular oportunidade para ${symbol}:`, error);
    }
  }

  console.log(`[Worker] Total de oportunidades: ${opportunities.length}`);
  return opportunities;
}

async function saveOpportunities(opportunities) {
  if (opportunities.length === 0) return;
  
  if (!prisma) {
    console.log('[Worker] ❌ Prisma não inicializado');
    return;
  }

  try {
    console.log('[Worker] 💾 Salvando oportunidades...');
    for (const opportunity of opportunities) {
      await prisma.spreadHistory.create({
        data: {
          symbol: opportunity.baseSymbol,
          spread: opportunity.profitPercentage,
          spotPrice: opportunity.buyAt.price,
          futuresPrice: opportunity.sellAt.price,
          exchangeBuy: opportunity.buyAt.exchange,
          exchangeSell: opportunity.sellAt.exchange,
          direction: opportunity.arbitrageType,
          timestamp: new Date(opportunity.timestamp)
        }
      });
      console.log(`[Worker] ✅ ${opportunity.baseSymbol} salvo!`);
    }
  } catch (error) {
    console.error('[Worker] ❌ Erro ao salvar:', error);
  }
}

function broadcastToClients(data) {
  if (!wss) return;
  
  const message = JSON.stringify(data);
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error('[Worker] Erro ao enviar para cliente:', error);
      }
    }
  });
}

async function createWebSocket(url, name) {
  console.log(`[${name}] Conectando em: ${url}`);
  
  const ws = new WebSocket(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    handshakeTimeout: 30000
  });

  ws.on('open', async () => {
    console.log(`[${name}] ✅ Conectado!`);
    
    // Subscrever símbolos de teste
    for (const symbol of TEST_SYMBOLS) {
      try {
        let symbolToUse = '';
        if (name === 'Gate.io Spot') symbolToUse = symbol.gateioSymbol;
        else if (name === 'MEXC Futures') symbolToUse = symbol.mexcFuturesSymbol;

        const message = SUBSCRIPTION_MESSAGES[name](symbolToUse);
        console.log(`[${name}] Subscrevendo ${symbolToUse}:`, JSON.stringify(message));
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`[${name}] Erro ao subscrever ${symbol.baseSymbol}:`, error);
      }
    }
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      processWebSocketMessage(name, message);
    } catch (error) {
      console.error(`[${name}] Erro ao processar mensagem:`, error);
    }
  });

  ws.on('error', (error) => {
    console.error(`[${name}] Erro:`, error);
  });

  ws.on('close', (code, reason) => {
    console.log(`[${name}] Fechado - Código: ${code}, Razão: ${reason}`);
    
    if (!isShuttingDown) {
      setTimeout(() => createWebSocket(url, name), RECONNECT_INTERVAL);
    }
  });

  return ws;
}

function initializeWebSocketServer() {
  const server = http.createServer();
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('[Worker] Novo cliente conectado');
    connectedClients.push(ws);
    
    ws.on('close', () => {
      connectedClients = connectedClients.filter(client => client !== ws);
    });
  });
  
  server.listen(WS_SERVER_PORT, () => {
    console.log('✅ Servidor WebSocket rodando na porta 10000');
  });
}

async function initializePrisma() {
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log('[Worker] ✅ Banco de dados conectado');
  } catch (error) {
    console.error('[Worker] ❌ Erro no banco:', error);
  }
}

async function monitorAndStore() {
  if (isWorkerRunning) return;

  try {
    isWorkerRunning = true;
    console.log(`[Worker ${new Date().toLocaleTimeString()}] Monitorando...`);
    
    const opportunities = calculateArbitrageOpportunities();
    
    if (opportunities.length > 0) {
      await saveOpportunities(opportunities);
      
      for (const opportunity of opportunities) {
        broadcastToClients(opportunity);
      }
      
      broadcastToClients({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        message: `Worker ativo - ${opportunities.length} oportunidades encontradas`
      });
    }
  } catch (error) {
    console.error('[Worker] Erro no monitoramento:', error);
  } finally {
    isWorkerRunning = false;
  }
}

async function startWorker() {
  console.log('[Worker] Iniciando worker de teste...');
  
  initializeWebSocketServer();
  await initializePrisma();
  await createWebSocket(GATEIO_WS_URL, 'Gate.io Spot');
  await createWebSocket(MEXC_FUTURES_WS_URL, 'MEXC Futures');
  
  while (!isShuttingDown) {
    await monitorAndStore();
    await new Promise(resolve => setTimeout(resolve, MONITORING_INTERVAL));
  }
}

process.on('SIGTERM', async () => {
  console.log('[Worker] Encerrando...');
  isShuttingDown = true;
  if (wss) wss.close();
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] Encerrando...');
  isShuttingDown = true;
  if (wss) wss.close();
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

startWorker().catch(error => {
  console.error('[Worker] Erro fatal:', error);
  process.exit(1);
}); 