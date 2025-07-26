// WORKER COM SERVIDOR HTTP E WEBSOCKET PARA RENDER
// Este arquivo é um BACKGROUND WORKER com servidor HTTP e WebSocket para o Render

import WebSocket from 'ws';
import http from 'http';
import { recordSpread } from '../lib/spread-tracker';
import { COMMON_PAIRS } from '../lib/predefined-pairs';

// Usar a lista de pares comuns do arquivo predefined-pairs
const STATIC_PAIRS = COMMON_PAIRS;

const MONITORING_INTERVAL = 5000; // 5 segundos
const RECONNECT_INTERVAL = 5000;
let isShuttingDown = false;

const GATEIO_SPOT_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';

const priceData: Record<string, { spot?: number; futures?: number }> = {};

// --- WEBSOCKET SERVER ---
const WS_PORT = Number(process.env.PORT) || 10000;
const server = http.createServer((req, res) => {
  // Configurar CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      clients: connectedClients.length 
    }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

// Configurar CORS para WebSocket
const wss = new (WebSocket as any).Server({ 
  server,
  perMessageDeflate: false,
  clientTracking: true
});

let connectedClients: WebSocket[] = [];

wss.on('connection', (ws: WebSocket, request: any) => {
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

server.listen(WS_PORT, process.env.HOSTNAME || '0.0.0.0', () => {
  console.log(`✅ WebSocket server rodando na porta ${WS_PORT} no host ${process.env.HOSTNAME || '0.0.0.0'}`);
  console.log(`⏱️ Servidor iniciado em ${new Date().toISOString()}`);
});

function broadcastOpportunity(opportunity: {
  symbol: string;
  spot: number;
  futures: number;
  spread: number;
}) {
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
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

// Função para broadcast de preços em tempo real
function broadcastPriceUpdate(symbol: string, marketType: 'spot' | 'futures', bestAsk: number, bestBid: number) {
  const message = {
    type: 'price-update',
    symbol: symbol,
    marketType: marketType,
    bestAsk: bestAsk,
    bestBid: bestBid,
    timestamp: Date.now()
  };
  
  console.log(`[Worker] 📤 Enviando price-update: ${symbol} ${marketType} - Ask: ${bestAsk}, Bid: ${bestBid}`);
  console.log(`[Worker] 📤 Clientes conectados: ${connectedClients.length}`);
  
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      console.log(`[Worker] ✅ Price-update enviado para cliente`);
    } else {
      console.log(`[Worker] ❌ Cliente não está aberto, estado: ${client.readyState}`);
    }
  }
}

// Função para conectar ao Gate.io Spot
function connectGateioSpot(symbols: string[]) {
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
        broadcastPriceUpdate(symbol, 'spot', ask, bid); // Broadcast price update com ask e bid
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
function connectMexcFutures(symbols: string[]) {
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
      if (msg.channel === 'push.ticker' && msg.data && msg.data.symbol) {
        const symbol = msg.data.symbol;
        const bid = parseFloat(msg.data.bid1);
        const ask = parseFloat(msg.data.ask1);
        if (!priceData[symbol]) priceData[symbol] = {};
        priceData[symbol].futures = bid;
        broadcastPriceUpdate(symbol, 'futures', ask, bid); // Broadcast price update com ask e bid
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

// Função para calcular e salvar oportunidades de arbitragem
async function monitorAndStore(symbols: string[]) {
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
        try {
          await recordSpread({
            symbol,
            exchangeBuy: 'gateio',
            exchangeSell: 'mexc',
            direction: 'spot-to-future',
            spread,
            spotPrice: spot,
            futuresPrice: futures
          });
          
          console.log(`[Worker] 📤 Enviando oportunidade via WebSocket: ${symbol}`);
          broadcastOpportunity({ symbol, spot, futures, spread });
          opportunitiesFound++;
        } catch (error) {
          console.error(`[ERRO] Falha ao salvar oportunidade ${symbol}:`, error);
        }
      } else {
        console.log(`[Worker] ${symbol}: Spread ${spread.toFixed(4)}% fora do range (0.1% - 50%)`);
      }
    } else {
      console.log(`[Worker] ${symbol}: Dados incompletos - Spot: ${spot || 'N/A'}, Futures: ${futures || 'N/A'}`);
    }
  }
  
  console.log(`[Worker] 📊 Resumo: ${symbolsWithData}/${symbols.length} símbolos com dados, ${opportunitiesFound} oportunidades encontradas`);
  
  if (opportunitiesFound > 0) {
    console.log(`[Worker] ✅ ${opportunitiesFound} oportunidades processadas e enviadas`);
  }
}

// Função principal
async function startWorker() {
  try {
    console.log('[Worker] 🚀 Iniciando worker de arbitragem...');
    console.log(`⏱️ Início: ${new Date().toISOString()}`);
    
    // Aguardar um pouco antes de conectar com as exchanges
    console.log('[Worker] ⏳ Aguardando 5 segundos antes de conectar com exchanges...');
    await new Promise((r) => setTimeout(r, 5000));
    
    const symbols = STATIC_PAIRS;
    console.log(`[Worker] 📊 Conectando com ${symbols.length} pares...`);
    
    connectGateioSpot(symbols);
    connectMexcFutures(symbols);
    
    console.log('[Worker] ✅ Monitoramento iniciado!');
    console.log(`[Worker] 📊 Monitorando ${symbols.length} pares`);
    console.log(`[Worker] ⏱️ Intervalo: ${MONITORING_INTERVAL/1000}s`);
    
    while (!isShuttingDown) {
      await monitorAndStore(symbols);
      await new Promise((r) => setTimeout(r, MONITORING_INTERVAL));
    }
  } catch (error) {
    console.error('[Worker] ❌ Erro fatal:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('[Worker] 🛑 Recebido sinal de parada...');
  isShuttingDown = true;
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] 🛑 Recebido sinal de término...');
  isShuttingDown = true;
  process.exit(0);
});

startWorker().catch((e) => {
  console.error('[Worker] ❌ Erro na inicialização:', e);
  process.exit(1);
});