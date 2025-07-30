// WORKER PARA RENDER - SEM SERVIDOR WEBSOCKET
// Este arquivo é um BACKGROUND WORKER otimizado para o Render

const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');
const fs = require('fs');

// Configurações
const MONITORING_INTERVAL = 500; // 500ms para atualizações rápidas
const RECONNECT_INTERVAL = 5000;
const DB_RETRY_INTERVAL = 30000;
const SUBSCRIPTION_INTERVAL = 5 * 60 * 1000;
const MIN_SPREAD_THRESHOLD = 0.01; // 0.01% mínimo
const MAX_SPREAD_THRESHOLD = 50; // 50% máximo

let isWorkerRunning = false;
let isShuttingDown = false;
let prisma = null;

// Armazenamento de preços em tempo real
const priceData = {
  'gateio_spot': {},
  'mexc_spot': {},
  'gateio_futures': {},
  'mexc_futures': {}
};

// Configurações WebSocket
const GATEIO_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_WS_URL = 'wss://wbs.mexc.com/ws';
const GATEIO_FUTURES_WS_URL = 'wss://fx-ws.gateio.ws/v4/ws/usdt';
// CORREÇÃO: URL correta da MEXC Futures
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';

// Carregar símbolos válidos da MEXC USDT
let MEXC_USDT_SYMBOLS = [];
try {
  MEXC_USDT_SYMBOLS = fs.readFileSync('mexc_usdt_symbols.txt', 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
  console.log(`[Worker] ${MEXC_USDT_SYMBOLS.length} símbolos USDT carregados para MEXC.`);
} catch (e) {
  console.warn('[Worker] Não foi possível carregar mexc_usdt_symbols.txt:', e.message);
}

// Lista estática de pares (fallback)
const STATIC_PAIRS = [
  { baseSymbol: 'BTC', gateioSymbol: 'BTC_USDT', mexcSymbol: 'BTC_USDT', gateioFuturesSymbol: 'BTC_USDT', mexcFuturesSymbol: 'BTC_USDT' },
  { baseSymbol: 'ETH', gateioSymbol: 'ETH_USDT', mexcSymbol: 'ETH_USDT', gateioFuturesSymbol: 'ETH_USDT', mexcFuturesSymbol: 'ETH_USDT' },
  { baseSymbol: 'DODO', gateioSymbol: 'DODO_USDT', mexcSymbol: 'DODO_USDT', gateioFuturesSymbol: 'DODO_USDT', mexcFuturesSymbol: 'DODO_USDT' }
];

// Mensagens de subscrição específicas para cada exchange
const SUBSCRIPTION_MESSAGES = {
  'Gate.io Spot': (symbol) => ({
    id: Date.now(),
    time: Date.now(),
    channel: "spot.tickers",
    event: "subscribe",
    payload: [symbol]
  }),
  'MEXC Spot': (symbol) => ({
    method: "sub.ticker",
    param: { symbol: symbol }
  }),
  'Gate.io Futures': (symbol) => ({
    id: Date.now(),
    time: Date.now(),
    channel: "futures.tickers",
    event: "subscribe",
    payload: [symbol]
  }),
  'MEXC Futures': (symbol) => ({
    method: "sub.ticker",
    param: { symbol: symbol.toLowerCase().replace('_', '_') }
  })
};

// Função para obter pares negociáveis
async function getTradablePairs() {
  // Se houver símbolos carregados, gerar a lista dinâmica
  if (MEXC_USDT_SYMBOLS.length > 0) {
    return MEXC_USDT_SYMBOLS.map(symbol => ({
      baseSymbol: symbol.replace('_USDT', ''),
      gateioSymbol: symbol,
      mexcSymbol: symbol,
      gateioFuturesSymbol: symbol,
      mexcFuturesSymbol: symbol
    }));
  }
  // Fallback para lista estática
  return STATIC_PAIRS;
}

// Função auxiliar para padronizar símbolo
function normalizeSymbol(symbol) {
  return symbol.toUpperCase().replace('-', '_');
}

// Função para processar mensagens WebSocket
function processWebSocketMessage(exchange, message) {
  try {
    const data = JSON.parse(message);
    
    if (exchange === 'Gate.io Spot' && data.channel === 'spot.tickers' && data.result) {
      const symbol = data.result.currency_pair;
      const price = parseFloat(data.result.last);
      
      if (price > 0) {
        priceData.gateio_spot[symbol] = {
          price: price,
          timestamp: Date.now()
        };
      }
    } else if (exchange === 'MEXC Spot' && data.c) {
      const symbol = data.s;
      const price = parseFloat(data.c);
      
      if (price > 0) {
        priceData.mexc_spot[symbol] = {
          price: price,
          timestamp: Date.now()
        };
      }
    } else if (exchange === 'Gate.io Futures' && data.channel === 'futures.tickers' && data.result) {
      const symbol = data.result.contract;
      const price = parseFloat(data.result.last);
      
      if (price > 0) {
        priceData.gateio_futures[symbol] = {
          price: price,
          timestamp: Date.now()
        };
      }
    } else if (exchange === 'MEXC Futures' && data.c) {
      const symbol = data.s;
      const price = parseFloat(data.c);
      
      if (price > 0) {
        priceData.mexc_futures[symbol] = {
          price: price,
          timestamp: Date.now()
        };
      }
    }
  } catch (error) {
    console.error(`[Worker] Erro ao processar mensagem do ${exchange}:`, error);
  }
}

// Função para calcular oportunidades de arbitragem
function calculateArbitrageOpportunities() {
  const opportunities = [];
  const pairs = getTradablePairs();
  
  for (const pair of pairs) {
    const gateioSpotPrice = priceData.gateio_spot[pair.gateioSymbol];
    const mexcSpotPrice = priceData.mexc_spot[pair.mexcSymbol];
    const gateioFuturesPrice = priceData.gateio_futures[pair.gateioFuturesSymbol];
    const mexcFuturesPrice = priceData.mexc_futures[pair.mexcFuturesSymbol];
    
    // Verificar se temos preços válidos
    if (gateioSpotPrice && mexcSpotPrice && gateioFuturesPrice && mexcFuturesPrice) {
      // Calcular spreads
      const spread1 = ((gateioFuturesPrice.price - mexcSpotPrice.price) / mexcSpotPrice.price) * 100;
      const spread2 = ((mexcFuturesPrice.price - gateioSpotPrice.price) / gateioSpotPrice.price) * 100;
      
      // Verificar se o spread está dentro dos limites
      if (Math.abs(spread1) >= MIN_SPREAD_THRESHOLD && Math.abs(spread1) <= MAX_SPREAD_THRESHOLD) {
        opportunities.push({
          baseSymbol: pair.baseSymbol,
          buyAt: { exchange: 'MEXC', type: 'spot', price: mexcSpotPrice.price },
          sellAt: { exchange: 'Gate.io', type: 'futures', price: gateioFuturesPrice.price },
          profitPercentage: spread1,
          timestamp: new Date()
        });
      }
      
      if (Math.abs(spread2) >= MIN_SPREAD_THRESHOLD && Math.abs(spread2) <= MAX_SPREAD_THRESHOLD) {
        opportunities.push({
          baseSymbol: pair.baseSymbol,
          buyAt: { exchange: 'Gate.io', type: 'spot', price: gateioSpotPrice.price },
          sellAt: { exchange: 'MEXC', type: 'futures', price: mexcFuturesPrice.price },
          profitPercentage: spread2,
          timestamp: new Date()
        });
      }
    }
  }
  
  return opportunities;
}

// Função para salvar oportunidades no banco
async function saveOpportunities(opportunities) {
  if (!prisma) return;
  
  try {
    for (const opportunity of opportunities) {
      await prisma.arbitrageOpportunity.create({
        data: {
          baseSymbol: opportunity.baseSymbol,
          buyExchange: opportunity.buyAt.exchange,
          buyType: opportunity.buyAt.type,
          buyPrice: opportunity.buyAt.price,
          sellExchange: opportunity.sellAt.exchange,
          sellType: opportunity.sellAt.type,
          sellPrice: opportunity.sellAt.price,
          profitPercentage: opportunity.profitPercentage,
          timestamp: opportunity.timestamp
        }
      });
    }
    console.log(`[Worker] ${opportunities.length} oportunidades salvas no banco`);
  } catch (error) {
    console.error('[Worker] Erro ao salvar oportunidades:', error);
  }
}

// Função para criar conexão WebSocket
async function createWebSocket(url, name) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    
    ws.on('open', () => {
      console.log(`[Worker] ✅ Conectado ao ${name}`);
      resolve(ws);
    });
    
    ws.on('message', (data) => {
      processWebSocketMessage(name, data.toString());
    });
    
    ws.on('close', (code, reason) => {
      console.log(`[Worker] ❌ Conexão ${name} fechada: ${code} - ${reason}`);
      setTimeout(() => {
        console.log(`[Worker] 🔄 Reconectando ao ${name}...`);
        createWebSocket(url, name);
      }, RECONNECT_INTERVAL);
    });
    
    ws.on('error', (error) => {
      console.error(`[Worker] Erro na conexão ${name}:`, error);
    });
    
    // Função para enviar mensagens
    function subscribe(symbol) {
      const message = SUBSCRIPTION_MESSAGES[name](symbol);
      ws.send(JSON.stringify(message));
    }
    
    // Retornar objeto com WebSocket e função de subscribe
    resolve({ ws, subscribe });
  });
}

// Função para inicializar WebSockets
async function initializeWebSockets() {
  console.log('[Worker] Inicializando conexões WebSocket...');
  
  try {
    const pairs = await getTradablePairs();
    const symbols = pairs.map(p => p.gateioSymbol).slice(0, 50); // Limitar a 50 símbolos
    
    // Conectar aos exchanges
    const gateioSpot = await createWebSocket(GATEIO_WS_URL, 'Gate.io Spot');
    const mexcSpot = await createWebSocket(MEXC_WS_URL, 'MEXC Spot');
    const gateioFutures = await createWebSocket(GATEIO_FUTURES_WS_URL, 'Gate.io Futures');
    const mexcFutures = await createWebSocket(MEXC_FUTURES_WS_URL, 'MEXC Futures');
    
    // Aguardar um pouco antes de subscrever
    setTimeout(() => {
      console.log(`[Worker] Subscrevendo ${symbols.length} símbolos...`);
      
      for (const symbol of symbols) {
        gateioSpot.subscribe(symbol);
        mexcSpot.subscribe(symbol);
        gateioFutures.subscribe(symbol);
        mexcFutures.subscribe(symbol);
      }
    }, 2000);
    
  } catch (error) {
    console.error('[Worker] Erro ao inicializar WebSockets:', error);
  }
}

// Função para inicializar Prisma
async function initializePrisma() {
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log('[Worker] Conexão com o banco de dados estabelecida');
  } catch (error) {
    console.error('[Worker] Erro ao conectar com banco:', error);
  }
}

// Função principal de monitoramento
async function monitorAndStore() {
  if (isWorkerRunning) {
    console.log('[Worker] Monitoramento já está em execução');
    return;
  }

  try {
    isWorkerRunning = true;
    console.log(`[Worker ${new Date().toLocaleTimeString()}] Monitoramento ativo - Gerando oportunidades reais`);
    
    const opportunities = calculateArbitrageOpportunities();
    
    if (opportunities.length > 0) {
      console.log(`[Worker] Geradas ${opportunities.length} oportunidades válidas`);
      
      await saveOpportunities(opportunities);
      
      for (const opportunity of opportunities) {
        console.log(`[Worker] ✅ Oportunidade enviada: ${opportunity.baseSymbol} - ${opportunity.profitPercentage.toFixed(4)}% - Spot: ${opportunity.buyAt.price} - Futures: ${opportunity.sellAt.price}`);
      }
    }
  } catch (error) {
    console.error('[Worker] Erro no monitoramento:', error);
  } finally {
    isWorkerRunning = false;
  }
}

// Função principal que mantém o worker rodando
async function startWorker() {
  console.log('[Worker] Iniciando worker em segundo plano...');
  
  await initializePrisma();
  await initializeWebSockets();
  
  while (!isShuttingDown) {
    await monitorAndStore();
    await new Promise(resolve => setTimeout(resolve, MONITORING_INTERVAL));
  }
}

// Tratamento de encerramento gracioso
process.on('SIGTERM', async () => {
  console.log('[Worker] Recebido sinal SIGTERM, encerrando graciosamente...');
  isShuttingDown = true;
  
  if (prisma) {
    await prisma.$disconnect();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] Recebido sinal SIGINT, encerrando graciosamente...');
  isShuttingDown = true;
  
  if (prisma) {
    await prisma.$disconnect();
  }
  
  process.exit(0);
});

// Iniciar o worker
startWorker().catch((error) => {
  console.error('[Worker] Erro fatal:', error);
  process.exit(1);
}); 