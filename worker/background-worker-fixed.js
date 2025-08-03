// WORKER COM SERVIDOR HTTP E WEBSOCKET PARA RENDER
// Este arquivo é um BACKGROUND WORKER com servidor HTTP e WebSocket para o Render

const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const fs = require('fs');

// Configurações
const MONITORING_INTERVAL = 500; // 500ms para atualizações rápidas
const RECONNECT_INTERVAL = 5000;
const DB_RETRY_INTERVAL = 30000;
const SUBSCRIPTION_INTERVAL = 5 * 60 * 1000;
const MIN_SPREAD_THRESHOLD = 0.01; // 0.01% mínimo
const MAX_SPREAD_THRESHOLD = 50; // 50% máximo
const WS_SERVER_PORT = 10000; // Porta do servidor WebSocket

let isWorkerRunning = false;
let isShuttingDown = false;
let prisma = null;

// Servidor WebSocket para transmitir oportunidades
let wss = null;
let connectedClients = [];

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
  return symbol.replace('-', '_').toUpperCase();
}

// Função para processar mensagens WebSocket e atualizar preços
function processWebSocketMessage(exchange, message) {
  if (!message || typeof message !== 'object') {
    return;
  }
  
  if (message.symbol && (message.symbol.includes('TEST') || message.symbol.includes('test'))) {
    console.log(`[Worker] Rejeitando dados de teste: ${message.symbol}`);
    return;
  }
  
  try {
    let symbol = '';
    let bestAsk = 0;
    let bestBid = 0;

    // Processa mensagens do Gate.io Spot
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
        console.log(`[LOG] Atualizando ${exchange} para ${normSymbol}: Ask=${bestAsk}, Bid=${bestBid}`);
      }
    }
    
    // Processa mensagens do MEXC Spot
    else if (exchange === 'MEXC Spot' && message.c && message.c.includes('spot.ticker')) {
      symbol = message.s;
      bestAsk = parseFloat(message.a);
      bestBid = parseFloat(message.b);
      
      if (symbol && bestAsk > 0 && bestBid > 0) {
        const normSymbol = normalizeSymbol(symbol);
        priceData['mexc_spot'][normSymbol] = {
          bestAsk,
          bestBid,
          timestamp: Date.now()
        };
        console.log(`[LOG] Atualizando ${exchange} para ${normSymbol}: Ask=${bestAsk}, Bid=${bestBid}`);
      }
    }
    
    // Processa mensagens do Gate.io Futures
    else if (exchange === 'Gate.io Futures' && message.channel === 'futures.tickers' && message.result) {
      symbol = message.result.contract;
      bestAsk = parseFloat(message.result.lowest_ask);
      bestBid = parseFloat(message.result.highest_bid);
      
      if (symbol && bestAsk > 0 && bestBid > 0) {
        const normSymbol = normalizeSymbol(symbol);
        priceData['gateio_futures'][normSymbol] = {
          bestAsk,
          bestBid,
          timestamp: Date.now()
        };
        console.log(`[LOG] Atualizando ${exchange} para ${normSymbol}: Ask=${bestAsk}, Bid=${bestBid}`);
      }
    }
    
    // Processa mensagens do MEXC Futures
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
        console.log(`[LOG] Atualizando ${exchange} para ${normSymbol}: Ask=${bestAsk}, Bid=${bestBid}`);
      }
    }
  } catch (error) {
    console.error(`[${exchange}] Erro ao processar mensagem:`, error);
  }
}

// Função para calcular oportunidades de arbitragem
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
        
        console.log(`[Worker] ${symbol}: Compra Spot=${spotPrice}, Venda Futures=${futuresPrice}, Spread=${spread.toFixed(4)}%`);
        
        if (spread >= MIN_SPREAD_THRESHOLD && spread <= MAX_SPREAD_THRESHOLD) {
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
          console.log(`[Worker] ✅ OPORTUNIDADE VÁLIDA: ${symbol} - ${spread.toFixed(4)}%`);
        }
      }
    } catch (error) {
      console.error(`[Worker] Erro ao calcular oportunidade para ${symbol}:`, error);
    }
  }

  console.log(`[Worker] Total de oportunidades encontradas: ${opportunities.length}`);
  return opportunities;
}

// Função para salvar oportunidades no banco
async function saveOpportunities(opportunities) {
  console.log(`[Worker] 🔍 Tentando salvar ${opportunities.length} oportunidades...`);
  
  const realOpportunities = opportunities.filter(opp => {
    if (opp.baseSymbol.includes('TEST') || opp.baseSymbol.includes('test')) {
      console.log(`[Worker] Rejeitando oportunidade de teste: ${opp.baseSymbol}`);
      return false;
    }
    
    if (opp.buyAt.price <= 0 || opp.sellAt.price <= 0) {
      console.log(`[Worker] Rejeitando oportunidade com preços inválidos: ${opp.baseSymbol} - Spot: ${opp.buyAt.price}, Futures: ${opp.sellAt.price}`);
      return false;
    }
    
    console.log(`[Worker] ✅ Oportunidade válida: ${opp.baseSymbol} - Spot: ${opp.buyAt.price}, Futures: ${opp.sellAt.price}`);
    return true;
  });
  
  console.log(`[Worker] 📊 ${realOpportunities.length} oportunidades válidas após filtro`);
  
  if (realOpportunities.length === 0) {
    console.log('[Worker] Nenhuma oportunidade real para salvar');
    return;
  }
  
  if (!prisma) {
    console.log('[Worker] ❌ Prisma não inicializado');
    return;
  }

  try {
    console.log('[Worker] 💾 Iniciando salvamento no banco...');
    for (const opportunity of realOpportunities) {
      console.log(`[Worker] 💾 Salvando ${opportunity.baseSymbol}...`);
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
      console.log(`[Worker] ✅ ${opportunity.baseSymbol} salvo com sucesso!`);
    }
    console.log(`[Worker] 💾 ${realOpportunities.length} oportunidades salvas no banco`);
  } catch (error) {
    console.error('[Worker] ❌ Erro ao salvar oportunidades:', error);
  }
}

// Função para broadcast para clientes WebSocket
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

// Função para criar conexão WebSocket
async function createWebSocket(url, name) {
  console.log(`[${name}] Tentando conectar em: ${url}`);
  
  const ws = new WebSocket(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    followRedirects: true,
    handshakeTimeout: name.includes('MEXC') ? 30000 : 10000
  });

  let subscriptionInterval;
  let isFirstConnection = true;

  function subscribe(symbol) {
    try {
      if (ws.readyState !== WebSocket.OPEN) {
        console.log(`[${name}] WebSocket não está aberto para subscrição`);
        return;
      }

      const getMessage = SUBSCRIPTION_MESSAGES[name];
      if (!getMessage) {
        console.error(`[${name}] Formato de mensagem não definido`);
        return;
      }

      let symbolToUse = '';
      if (name === 'Gate.io Spot') symbolToUse = symbol.gateioSymbol;
      else if (name === 'MEXC Spot') symbolToUse = symbol.mexcSymbol;
      else if (name === 'Gate.io Futures') symbolToUse = symbol.gateioFuturesSymbol;
      else if (name === 'MEXC Futures') symbolToUse = symbol.mexcFuturesSymbol;

      const message = getMessage(symbolToUse);
      console.log(`[${name}] Enviando subscrição para ${symbolToUse}:`, JSON.stringify(message));
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[${name}] Erro ao subscrever ${symbol.baseSymbol}:`, error);
    }
  }

  ws.on('open', async () => {
    console.log(`[${name}] Conexão WebSocket estabelecida`);
    
    try {
      if (isFirstConnection) {
        isFirstConnection = false;
        const symbols = await getTradablePairs();
        console.log(`[${name}] Pares obtidos na primeira conexão:`, symbols.length);
        
        const defaultSymbols = symbols.length > 0 ? symbols : [{
          baseSymbol: 'BTC',
          gateioSymbol: 'BTC_USDT',
          mexcSymbol: 'BTC_USDT',
          gateioFuturesSymbol: 'BTC_USDT',
          mexcFuturesSymbol: 'BTC_USDT'
        }];

        for (const symbol of defaultSymbols) {
          subscribe(symbol);
        }
      }

      subscriptionInterval = setInterval(async () => {
        const symbols = await getTradablePairs();
        const defaultSymbols = symbols.length > 0 ? symbols : [{
          baseSymbol: 'BTC',
          gateioSymbol: 'BTC_USDT',
          mexcSymbol: 'BTC_USDT',
          gateioFuturesSymbol: 'BTC_USDT',
          mexcFuturesSymbol: 'BTC_USDT'
        }];

        for (const symbol of defaultSymbols) {
          subscribe(symbol);
        }
      }, SUBSCRIPTION_INTERVAL);
    } catch (error) {
      console.error(`[${name}] Erro ao iniciar subscrições:`, error);
    }
  });

  ws.on('error', (error) => {
    console.error(`[${name}] Erro WebSocket:`, error);
    clearInterval(subscriptionInterval);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      processWebSocketMessage(name, message);
    } catch (error) {
      console.error(`[${name}] Erro ao processar mensagem:`, error);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[${name}] Conexão WebSocket fechada - Código: ${code}, Razão: ${reason}`);
    clearInterval(subscriptionInterval);
    
    if (!isShuttingDown) {
      console.log(`[${name}] Tentando reconectar em ${RECONNECT_INTERVAL/1000} segundos...`);
      setTimeout(async () => {
        try {
          createWebSocket(url, name);
        } catch (error) {
          console.error(`[${name}] Erro ao reconectar:`, error);
        }
      }, RECONNECT_INTERVAL);
    }
  });

  return ws;
}

// Função para inicializar WebSockets
async function initializeWebSockets() {
  console.log('[Worker] Inicializando conexões WebSocket...');
  
  try {
    await createWebSocket(GATEIO_WS_URL, 'Gate.io Spot');
    await createWebSocket(MEXC_WS_URL, 'MEXC Spot');
    await createWebSocket(GATEIO_FUTURES_WS_URL, 'Gate.io Futures');
    await createWebSocket(MEXC_FUTURES_WS_URL, 'MEXC Futures');
  } catch (error) {
    console.error('[Worker] Erro ao inicializar WebSockets:', error);
  }
}

// Função para inicializar servidor WebSocket
function initializeWebSocketServer() {
  const server = http.createServer();
  
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('[Worker] Novo cliente WebSocket conectado');
    connectedClients.push(ws);
    
    ws.on('close', () => {
      console.log('[Worker] Cliente WebSocket desconectado');
      connectedClients = connectedClients.filter(client => client !== ws);
    });
    
    ws.on('error', (error) => {
      console.error('[Worker] Erro no cliente WebSocket:', error);
      connectedClients = connectedClients.filter(client => client !== ws);
    });
  });
  
  server.listen(WS_SERVER_PORT, () => {
    console.log('✅ Servidor WebSocket rodando na porta 10000');
    console.log('🌐 WebSocket disponível em ws://localhost:10000');
  });
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
        broadcastToClients(opportunity);
      }
      
      broadcastToClients({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        message: `Worker ativo - ${opportunities.length} oportunidades encontradas`,
        updateInterval: MONITORING_INTERVAL / 1000
      });
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
  
  initializeWebSocketServer();
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
  
  if (wss) {
    wss.close();
  }
  
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] Recebido sinal SIGINT, encerrando graciosamente...');
  isShuttingDown = true;
  
  if (wss) {
    wss.close();
  }
  
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

// Iniciar o worker
startWorker().catch(error => {
  console.error('[Worker] Erro fatal:', error);
  process.exit(1);
}); 