// WORKER COM SERVIDOR HTTP E WEBSOCKET PARA RENDER
// Este arquivo é um BACKGROUND WORKER com servidor HTTP e WebSocket para o Render

import WebSocket from 'ws';
import http from 'http';
import { recordSpread } from '../lib/spread-tracker';

// Lista estática de pares (TODOS os pares das duas listas fornecidas)
const STATIC_PAIRS = [
  // Gate.io – Lista de pares
  '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
  'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
  'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'DADDY_USDT', 'DAG_USDT', 'DEGEN_USDT',
  'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT', 'WMTX_USDT', 'PIN_USDT',
  'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT', 'TARA_USDT', 'BERT_USDT',
  'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT', 'RBNT_USDT', 'TOMI_USDT',
  'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT', 'ALPINE_USDT', 'CITY_USDT',
  'ILV_USDT', 'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'SYS_USDT', 'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT',
  'LUNAI_USDT', 'MORE_USDT', 'MGO_USDT', 'GROK_USDT',
  
  // MEXC – Lista de pares (adicionais)
  'CUDIS_USDT', 'ENJ_USDT', 'ALICE_USDT', 'PSG_USDT', 'REX_USDT', 'B_USDT', 'RED_USDT', 'GTC_USDT', 'TALE_USDT', 'RWA_USDT',
  'CESS_USDT', 'QUBIC_USDT', 'TEL_USDT', 'SHM_USDT', 'DOLO_USDT', 'LABUBU_USDT', 'ZIG_USDT', 'BAR_USDT', 'MASA_USDT', 'XEM_USDT',
  'ULTI_USDT', 'LUMIA_USDT', 'PONKE_USDT',
  
  // Pares adicionais que estavam aparecendo na tabela
  'VANRY_USDT', 'POLS_USDT', 'EPIC_USDT', 'CLOUD_USDT', 'DGB_USDT', 'OG_USDT', 'FLM_USDT'
];

const MONITORING_INTERVAL = 5000; // 5 segundos
const RECONNECT_INTERVAL = 5000;
let isShuttingDown = false;

const GATEIO_SPOT_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';

const priceData: Record<string, { spot?: number; futures?: number }> = {};

// --- WEBSOCKET SERVER ---
const WS_PORT = 10000;
const server = http.createServer();
const wss = new (WebSocket as any).Server({ 
  server,
  // Configurações de CORS para permitir conexões do frontend
  perMessageDeflate: false,
  clientTracking: true
});
let connectedClients: WebSocket[] = [];

wss.on('connection', (ws: WebSocket, request: any) => {
  console.log('[Worker] ✅ Nova conexão WebSocket estabelecida');
  connectedClients.push(ws);
  ws.send(JSON.stringify({ type: 'connection', message: 'Conectado ao worker de arbitragem!' }));
  ws.on('close', () => {
    console.log('[Worker] 🔌 Cliente WebSocket desconectado');
    connectedClients = connectedClients.filter((c) => c !== ws);
  });
  ws.on('error', (error) => {
    console.error('[Worker] ❌ Erro no cliente WebSocket:', error);
    connectedClients = connectedClients.filter((c) => c !== ws);
  });
});

server.listen(WS_PORT, () => {
  console.log(`✅ WebSocket server rodando na porta ${WS_PORT}`);
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
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
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
      if (msg.channel === 'push.ticker' && msg.data && msg.symbol) {
        const symbol = msg.symbol;
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
  let opportunitiesFound = 0;
  for (const symbol of symbols) {
    const spot = priceData[symbol]?.spot;
    const futures = priceData[symbol]?.futures;
    if (spot && futures && spot > 0 && futures > 0) {
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
            spotPrice: spot,         // Corrigido: agora salva o preço do spot
            futuresPrice: futures    // Corrigido: agora salva o preço do futures
          });
          broadcastOpportunity({ symbol, spot, futures, spread });
          opportunitiesFound++;
        } catch (error) {
          console.error(`[ERRO] Falha ao salvar oportunidade ${symbol}:`, error);
        }
      }
    }
  }
  if (opportunitiesFound > 0) {
    console.log(`[Worker] ${opportunitiesFound} oportunidades salvas no banco`);
  }
}

// Função principal
async function startWorker() {
  try {
    console.log('[Worker] 🚀 Iniciando worker de arbitragem...');
    const symbols = STATIC_PAIRS;
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