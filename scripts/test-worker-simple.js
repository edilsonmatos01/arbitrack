const WebSocket = require('ws');

// Lista estática de pares (mesma do worker real)
const STATIC_PAIRS = [
  '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
  'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
  'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'DADDY_USDT', 'DAG_USDT', 'DEGEN_USDT',
  'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT', 'WMTX_USDT', 'PIN_USDT',
  'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT', 'TARA_USDT', 'BERT_USDT',
  'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT', 'RBNT_USDT', 'TOMI_USDT',
  'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT', 'ALPINE_USDT', 'CITY_USDT',
  'ILV_USDT', 'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'SYS_USDT', 'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT',
  'LUNAI_USDT', 'MORE_USDT', 'MGO_USDT', 'GROK_USDT'
];

// URLs WebSocket
const GATEIO_SPOT_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';

// Armazenamento de preços
const priceData = {};

console.log('🚀 Iniciando worker de arbitragem (versão simples)...');
console.log(`📊 Monitorando ${STATIC_PAIRS.length} pares`);
console.log('⏱️ Intervalo: 5s\n');

// Função para conectar ao Gate.io Spot
function connectGateioSpot() {
  const ws = new WebSocket(GATEIO_SPOT_WS_URL);
  
  ws.on('open', () => {
    console.log('[Gate.io Spot] ✅ Conectado!');
    STATIC_PAIRS.forEach((symbol) => {
      const msg = {
        id: Date.now(),
        time: Date.now(),
        channel: 'spot.tickers',
        event: 'subscribe',
        payload: [symbol],
      };
      ws.send(JSON.stringify(msg));
    });
    console.log(`[Gate.io Spot] Subscrito a ${STATIC_PAIRS.length} símbolos`);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.channel === 'spot.tickers' && msg.result) {
        const symbol = msg.result.currency_pair;
        const ask = parseFloat(msg.result.lowest_ask);
        if (!priceData[symbol]) priceData[symbol] = {};
        priceData[symbol].spot = ask;
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    console.log('[Gate.io Spot] 🔌 Conexão fechada');
    setTimeout(() => connectGateioSpot(), 5000);
  });

  ws.on('error', (err) => {
    console.error('[Gate.io Spot] ❌ Erro:', err.message);
  });
}

// Função para conectar ao MEXC Futures
function connectMexcFutures() {
  const ws = new WebSocket(MEXC_FUTURES_WS_URL);
  
  ws.on('open', () => {
    console.log('[MEXC Futures] ✅ Conectado!');
    STATIC_PAIRS.forEach((symbol) => {
      const msg = {
        method: 'sub.ticker',
        param: { symbol },
      };
      ws.send(JSON.stringify(msg));
    });
    console.log(`[MEXC Futures] Subscrito a ${STATIC_PAIRS.length} símbolos`);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.channel === 'push.ticker' && msg.data && msg.symbol) {
        const symbol = msg.symbol;
        const bid = parseFloat(msg.data.bid1);
        if (!priceData[symbol]) priceData[symbol] = {};
        priceData[symbol].futures = bid;
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    console.log('[MEXC Futures] 🔌 Conexão fechada');
    setTimeout(() => connectMexcFutures(), 5000);
  });

  ws.on('error', (err) => {
    console.error('[MEXC Futures] ❌ Erro:', err.message);
  });
}

// Função para calcular oportunidades
function calculateOpportunities() {
  let opportunitiesFound = 0;
  
  STATIC_PAIRS.forEach(symbol => {
    const spot = priceData[symbol]?.spot;
    const futures = priceData[symbol]?.futures;
    
    if (spot && futures && spot > 0 && futures > 0) {
      const spread = ((futures - spot) / spot) * 100;
      
      if (spread > 0.1 && spread < 50) {
        const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        console.log(`[${now}] 💰 OPORTUNIDADE: ${symbol}: Spot=${spot} Futures=${futures} Spread=${spread.toFixed(4)}%`);
        opportunitiesFound++;
      }
    }
  });
  
  if (opportunitiesFound > 0) {
    console.log(`📊 ${opportunitiesFound} oportunidades encontradas!\n`);
  }
}

// Inicia conexões
connectGateioSpot();
connectMexcFutures();

// Loop de monitoramento
setInterval(calculateOpportunities, 5000);

console.log('✅ Worker iniciado! Monitorando oportunidades...\n');

// Tratamento de shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Parando worker...');
  process.exit(0);
}); 