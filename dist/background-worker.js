"use strict";
// WORKER COM SERVIDOR HTTP E WEBSOCKET PARA RENDER
// Este arquivo é um BACKGROUND WORKER com servidor HTTP e WebSocket para o Render
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const ws_1 = __importDefault(require("ws"));
const ws_2 = require("ws");
const https = __importStar(require("https"));
const http = __importStar(require("http"));
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
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';
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
        param: { symbol }
    })
};
// Função para enviar dados via WebSocket
function broadcastToClients(data) {
    if (connectedClients.length === 0)
        return;
    const message = JSON.stringify(data);
    const clientsToRemove = [];
    connectedClients.forEach((client, index) => {
        if (client.readyState === ws_1.default.OPEN) {
            try {
                client.send(message);
            }
            catch (error) {
                console.error('[WebSocket] Erro ao enviar mensagem:', error);
                clientsToRemove.push(index);
            }
        }
        else {
            clientsToRemove.push(index);
        }
    });
    // Remover clientes desconectados (em ordem reversa para não afetar índices)
    clientsToRemove.reverse().forEach(index => {
        connectedClients.splice(index, 1);
    });
}
// Função para verificar URL antes de conectar WebSocket
async function checkEndpoint(url, name) {
    // Validar se a URL não está vazia
    if (!url || url.trim() === '') {
        console.error(`[${name}] URL vazia ou inválida: ${url}`);
        throw new Error(`URL inválida para ${name}: ${url}`);
    }
    return new Promise((resolve) => {
        const httpsUrl = url.replace('wss://', 'https://');
        https.get(httpsUrl, (res) => {
            if (res.statusCode === 307 || res.statusCode === 302 || res.statusCode === 301) {
                const location = res.headers.location;
                if (location) {
                    const newUrl = `wss://${location.replace('https://', '')}`;
                    console.log(`[${name}] Redirecionamento detectado: ${url} -> ${newUrl}`);
                    resolve(newUrl);
                }
                else {
                    console.log(`[${name}] Redirecionamento sem location header, usando URL original: ${url}`);
                    resolve(url);
                }
            }
            else {
                console.log(`[${name}] Endpoint válido: ${url}`);
                resolve(url);
            }
        }).on('error', (err) => {
            console.error(`[${name}] Erro ao verificar endpoint ${url}:`, err);
            console.log(`[${name}] Usando URL original devido ao erro: ${url}`);
            resolve(url);
        });
    });
}
// Função para criar conexão WebSocket
async function createWebSocket(url, name) {
    console.log(`[${name}] Tentando conectar em: ${url}`);
    const ws = new ws_1.default(url, {
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
            if (ws.readyState !== ws_1.default.OPEN) {
                console.log(`[${name}] WebSocket não está aberto para subscrição`);
                return;
            }
            const getMessage = SUBSCRIPTION_MESSAGES[name];
            if (!getMessage) {
                console.error(`[${name}] Formato de mensagem não definido`);
                return;
            }
            let symbolToUse = '';
            if (name === 'Gate.io Spot')
                symbolToUse = symbol.gateioSymbol;
            else if (name === 'MEXC Spot')
                symbolToUse = symbol.mexcSymbol;
            else if (name === 'Gate.io Futures')
                symbolToUse = symbol.gateioFuturesSymbol;
            else if (name === 'MEXC Futures')
                symbolToUse = symbol.mexcFuturesSymbol;
            const message = getMessage(symbolToUse);
            console.log(`[${name}] Enviando subscrição para ${symbolToUse}:`, JSON.stringify(message));
            ws.send(JSON.stringify(message));
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error(`[${name}] Erro ao processar mensagem:`, error);
        }
    });
    ws.on('close', (code, reason) => {
        console.log(`[${name}] Conexão WebSocket fechada - Código: ${code}, Razão: ${reason}`);
        clearInterval(subscriptionInterval);
        if (!isShuttingDown) {
            console.log(`[${name}] Tentando reconectar em ${RECONNECT_INTERVAL / 1000} segundos...`);
            setTimeout(async () => {
                try {
                    // Usar a URL original diretamente, sem verificação adicional
                    createWebSocket(url, name);
                }
                catch (error) {
                    console.error(`[${name}] Erro ao reconectar:`, error);
                }
            }, RECONNECT_INTERVAL);
        }
    });
    return ws;
}
// Inicializa as conexões WebSocket
let gateioWs;
let mexcFuturesWs;
// Função para inicializar as conexões WebSocket
async function initializeWebSockets() {
    try {
        // ESTRATÉGIA: Gate.io SPOT vs MEXC FUTURES
        console.log('[Worker] Iniciando estratégia: Gate.io SPOT → MEXC FUTURES');
        gateioWs = await createWebSocket(GATEIO_WS_URL, 'Gate.io Spot');
        mexcFuturesWs = await createWebSocket(MEXC_FUTURES_WS_URL, 'MEXC Futures');
        // Desabilitar conexões desnecessárias
        console.log('[Worker] Conexões MEXC Spot e Gate.io Futures desabilitadas');
    }
    catch (error) {
        console.error('[Worker] Erro ao inicializar conexões WebSocket:', error);
    }
}
// Função para inicializar o servidor WebSocket
function initializeWebSocketServer() {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'Worker ativo',
            timestamp: new Date().toISOString(),
            message: 'Servidor worker funcionando corretamente',
            websocketClients: connectedClients.length,
            updateInterval: MONITORING_INTERVAL / 1000 + ' segundos'
        }));
    });
    wss = new ws_2.Server({ server });
    wss.on('connection', (ws) => {
        console.log('[WebSocket] Novo cliente conectado');
        connectedClients.push(ws);
        // Enviar mensagem de boas-vindas
        ws.send(JSON.stringify({
            type: 'connection',
            message: 'Conectado ao servidor de arbitragem em tempo real',
            timestamp: new Date().toISOString()
        }));
        ws.on('close', () => {
            console.log('[WebSocket] Cliente desconectado');
            const index = connectedClients.indexOf(ws);
            if (index > -1) {
                connectedClients.splice(index, 1);
            }
        });
        ws.on('error', (error) => {
            console.error('[WebSocket] Erro no cliente:', error);
        });
    });
    server.listen(WS_SERVER_PORT, () => {
        console.log(`✅ Servidor WebSocket rodando na porta ${WS_SERVER_PORT}`);
        console.log(`🌐 WebSocket disponível em ws://localhost:${WS_SERVER_PORT}`);
    });
}
// Função para inicializar o Prisma com retry
async function initializePrisma() {
    while (!isShuttingDown) {
        try {
            if (!prisma) {
                prisma = new client_1.PrismaClient();
                await prisma.$connect();
                console.log('[Worker] Conexão com o banco de dados estabelecida');
                break;
            }
        }
        catch (error) {
            console.error('[Worker] Erro ao conectar com o banco de dados:', error);
            console.log(`[Worker] Tentando reconectar ao banco de dados em ${DB_RETRY_INTERVAL / 1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, DB_RETRY_INTERVAL));
        }
    }
}
// Função para obter pares negociáveis
// Lista estática de pares conforme especificado
const STATIC_PAIRS = [
    // Gate.io Spot e MEXC Futures (estratégia: compra spot, venda futures)
    { baseSymbol: '1DOLLAR', gateioSymbol: '1DOLLAR_USDT', mexcSymbol: '1DOLLAR_USDT', gateioFuturesSymbol: '1DOLLAR_USDT', mexcFuturesSymbol: '1DOLLAR_USDT' },
    { baseSymbol: 'ACA', gateioSymbol: 'ACA_USDT', mexcSymbol: 'ACA_USDT', gateioFuturesSymbol: 'ACA_USDT', mexcFuturesSymbol: 'ACA_USDT' },
    { baseSymbol: 'ACE', gateioSymbol: 'ACE_USDT', mexcSymbol: 'ACE_USDT', gateioFuturesSymbol: 'ACE_USDT', mexcFuturesSymbol: 'ACE_USDT' },
    { baseSymbol: 'ACS', gateioSymbol: 'ACS_USDT', mexcSymbol: 'ACS_USDT', gateioFuturesSymbol: 'ACS_USDT', mexcFuturesSymbol: 'ACS_USDT' },
    { baseSymbol: 'ACT', gateioSymbol: 'ACT_USDT', mexcSymbol: 'ACT_USDT', gateioFuturesSymbol: 'ACT_USDT', mexcFuturesSymbol: 'ACT_USDT' },
    { baseSymbol: 'AEVO', gateioSymbol: 'AEVO_USDT', mexcSymbol: 'AEVO_USDT', gateioFuturesSymbol: 'AEVO_USDT', mexcFuturesSymbol: 'AEVO_USDT' },
    { baseSymbol: 'AGLD', gateioSymbol: 'AGLD_USDT', mexcSymbol: 'AGLD_USDT', gateioFuturesSymbol: 'AGLD_USDT', mexcFuturesSymbol: 'AGLD_USDT' },
    { baseSymbol: 'AIC', gateioSymbol: 'AIC_USDT', mexcSymbol: 'AIC_USDT', gateioFuturesSymbol: 'AIC_USDT', mexcFuturesSymbol: 'AIC_USDT' },
    { baseSymbol: 'ALU', gateioSymbol: 'ALU_USDT', mexcSymbol: 'ALU_USDT', gateioFuturesSymbol: 'ALU_USDT', mexcFuturesSymbol: 'ALU_USDT' },
    { baseSymbol: 'ANON', gateioSymbol: 'ANON_USDT', mexcSymbol: 'ANON_USDT', gateioFuturesSymbol: 'ANON_USDT', mexcFuturesSymbol: 'ANON_USDT' },
    { baseSymbol: 'APX', gateioSymbol: 'APX_USDT', mexcSymbol: 'APX_USDT', gateioFuturesSymbol: 'APX_USDT', mexcFuturesSymbol: 'APX_USDT' },
    { baseSymbol: 'ARKM', gateioSymbol: 'ARKM_USDT', mexcSymbol: 'ARKM_USDT', gateioFuturesSymbol: 'ARKM_USDT', mexcFuturesSymbol: 'ARKM_USDT' },
    { baseSymbol: 'AR', gateioSymbol: 'AR_USDT', mexcSymbol: 'AR_USDT', gateioFuturesSymbol: 'AR_USDT', mexcFuturesSymbol: 'AR_USDT' },
    { baseSymbol: 'AUCTION', gateioSymbol: 'AUCTION_USDT', mexcSymbol: 'AUCTION_USDT', gateioFuturesSymbol: 'AUCTION_USDT', mexcFuturesSymbol: 'AUCTION_USDT' },
    { baseSymbol: 'B2', gateioSymbol: 'B2_USDT', mexcSymbol: 'B2_USDT', gateioFuturesSymbol: 'B2_USDT', mexcFuturesSymbol: 'B2_USDT' },
    { baseSymbol: 'BLUR', gateioSymbol: 'BLUR_USDT', mexcSymbol: 'BLUR_USDT', gateioFuturesSymbol: 'BLUR_USDT', mexcFuturesSymbol: 'BLUR_USDT' },
    { baseSymbol: 'BLZ', gateioSymbol: 'BLZ_USDT', mexcSymbol: 'BLZ_USDT', gateioFuturesSymbol: 'BLZ_USDT', mexcFuturesSymbol: 'BLZ_USDT' },
    { baseSymbol: 'BOOP', gateioSymbol: 'BOOP_USDT', mexcSymbol: 'BOOP_USDT', gateioFuturesSymbol: 'BOOP_USDT', mexcFuturesSymbol: 'BOOP_USDT' },
    { baseSymbol: 'BOTIFY', gateioSymbol: 'BOTIFY_USDT', mexcSymbol: 'BOTIFY_USDT', gateioFuturesSymbol: 'BOTIFY_USDT', mexcFuturesSymbol: 'BOTIFY_USDT' },
    { baseSymbol: 'BOXCAT', gateioSymbol: 'BOXCAT_USDT', mexcSymbol: 'BOXCAT_USDT', gateioFuturesSymbol: 'BOXCAT_USDT', mexcFuturesSymbol: 'BOXCAT_USDT' },
    { baseSymbol: 'BRISE', gateioSymbol: 'BRISE_USDT', mexcSymbol: 'BRISE_USDT', gateioFuturesSymbol: 'BRISE_USDT', mexcFuturesSymbol: 'BRISE_USDT' },
    { baseSymbol: 'BR', gateioSymbol: 'BR_USDT', mexcSymbol: 'BR_USDT', gateioFuturesSymbol: 'BR_USDT', mexcFuturesSymbol: 'BR_USDT' },
    { baseSymbol: 'BUBB', gateioSymbol: 'BUBB_USDT', mexcSymbol: 'BUBB_USDT', gateioFuturesSymbol: 'BUBB_USDT', mexcFuturesSymbol: 'BUBB_USDT' },
    { baseSymbol: 'CBK', gateioSymbol: 'CBK_USDT', mexcSymbol: 'CBK_USDT', gateioFuturesSymbol: 'CBK_USDT', mexcFuturesSymbol: 'CBK_USDT' },
    { baseSymbol: 'CHESS', gateioSymbol: 'CHESS_USDT', mexcSymbol: 'CHESS_USDT', gateioFuturesSymbol: 'CHESS_USDT', mexcFuturesSymbol: 'CHESS_USDT' },
    { baseSymbol: 'CKB', gateioSymbol: 'CKB_USDT', mexcSymbol: 'CKB_USDT', gateioFuturesSymbol: 'CKB_USDT', mexcFuturesSymbol: 'CKB_USDT' },
    { baseSymbol: 'CPOOL', gateioSymbol: 'CPOOL_USDT', mexcSymbol: 'CPOOL_USDT', gateioFuturesSymbol: 'CPOOL_USDT', mexcFuturesSymbol: 'CPOOL_USDT' },
    { baseSymbol: 'DADDY', gateioSymbol: 'DADDY_USDT', mexcSymbol: 'DADDY_USDT', gateioFuturesSymbol: 'DADDY_USDT', mexcFuturesSymbol: 'DADDY_USDT' },
    { baseSymbol: 'DAG', gateioSymbol: 'DAG_USDT', mexcSymbol: 'DAG_USDT', gateioFuturesSymbol: 'DAG_USDT', mexcFuturesSymbol: 'DAG_USDT' },
    { baseSymbol: 'DEGEN', gateioSymbol: 'DEGEN_USDT', mexcSymbol: 'DEGEN_USDT', gateioFuturesSymbol: 'DEGEN_USDT', mexcFuturesSymbol: 'DEGEN_USDT' },
    { baseSymbol: 'DEAI', gateioSymbol: 'DEAI_USDT', mexcSymbol: 'DEAI_USDT', gateioFuturesSymbol: 'DEAI_USDT', mexcFuturesSymbol: 'DEAI_USDT' },
    { baseSymbol: 'DODO', gateioSymbol: 'DODO_USDT', mexcSymbol: 'DODO_USDT', gateioFuturesSymbol: 'DODO_USDT', mexcFuturesSymbol: 'DODO_USDT' },
    { baseSymbol: 'DEVVE', gateioSymbol: 'DEVVE_USDT', mexcSymbol: 'DEVVE_USDT', gateioFuturesSymbol: 'DEVVE_USDT', mexcFuturesSymbol: 'DEVVE_USDT' },
    { baseSymbol: 'DOGINME', gateioSymbol: 'DOGINME_USDT', mexcSymbol: 'DOGINME_USDT', gateioFuturesSymbol: 'DOGINME_USDT', mexcFuturesSymbol: 'DOGINME_USDT' },
    { baseSymbol: 'BTC', gateioSymbol: 'BTC_USDT', mexcSymbol: 'BTC_USDT', gateioFuturesSymbol: 'BTC_USDT', mexcFuturesSymbol: 'BTC_USDT' },
    { baseSymbol: 'G7', gateioSymbol: 'G7_USDT', mexcSymbol: 'G7_USDT', gateioFuturesSymbol: 'G7_USDT', mexcFuturesSymbol: 'G7_USDT' },
    { baseSymbol: 'NAKA', gateioSymbol: 'NAKA_USDT', mexcSymbol: 'NAKA_USDT', gateioFuturesSymbol: 'NAKA_USDT', mexcFuturesSymbol: 'NAKA_USDT' },
    { baseSymbol: 'VR', gateioSymbol: 'VR_USDT', mexcSymbol: 'VR_USDT', gateioFuturesSymbol: 'VR_USDT', mexcFuturesSymbol: 'VR_USDT' },
    { baseSymbol: 'WMTX', gateioSymbol: 'WMTX_USDT', mexcSymbol: 'WMTX_USDT', gateioFuturesSymbol: 'WMTX_USDT', mexcFuturesSymbol: 'WMTX_USDT' },
    { baseSymbol: 'PIN', gateioSymbol: 'PIN_USDT', mexcSymbol: 'PIN_USDT', gateioFuturesSymbol: 'PIN_USDT', mexcFuturesSymbol: 'PIN_USDT' },
    { baseSymbol: 'WILD', gateioSymbol: 'WILD_USDT', mexcSymbol: 'WILD_USDT', gateioFuturesSymbol: 'WILD_USDT', mexcFuturesSymbol: 'WILD_USDT' },
    { baseSymbol: 'BFTOKEN', gateioSymbol: 'BFTOKEN_USDT', mexcSymbol: 'BFTOKEN_USDT', gateioFuturesSymbol: 'BFTOKEN_USDT', mexcFuturesSymbol: 'BFTOKEN_USDT' },
    { baseSymbol: 'VELAAI', gateioSymbol: 'VELAAI_USDT', mexcSymbol: 'VELAAI_USDT', gateioFuturesSymbol: 'VELAAI_USDT', mexcFuturesSymbol: 'VELAAI_USDT' },
    { baseSymbol: 'GEAR', gateioSymbol: 'GEAR_USDT', mexcSymbol: 'GEAR_USDT', gateioFuturesSymbol: 'GEAR_USDT', mexcFuturesSymbol: 'GEAR_USDT' },
    { baseSymbol: 'GNC', gateioSymbol: 'GNC_USDT', mexcSymbol: 'GNC_USDT', gateioFuturesSymbol: 'GNC_USDT', mexcFuturesSymbol: 'GNC_USDT' },
    { baseSymbol: 'SUPRA', gateioSymbol: 'SUPRA_USDT', mexcSymbol: 'SUPRA_USDT', gateioFuturesSymbol: 'SUPRA_USDT', mexcFuturesSymbol: 'SUPRA_USDT' },
    { baseSymbol: 'MAGA', gateioSymbol: 'MAGA_USDT', mexcSymbol: 'MAGA_USDT', gateioFuturesSymbol: 'MAGA_USDT', mexcFuturesSymbol: 'MAGA_USDT' },
    { baseSymbol: 'TARA', gateioSymbol: 'TARA_USDT', mexcSymbol: 'TARA_USDT', gateioFuturesSymbol: 'TARA_USDT', mexcFuturesSymbol: 'TARA_USDT' },
    { baseSymbol: 'BERT', gateioSymbol: 'BERT_USDT', mexcSymbol: 'BERT_USDT', gateioFuturesSymbol: 'BERT_USDT', mexcFuturesSymbol: 'BERT_USDT' },
    { baseSymbol: 'AO', gateioSymbol: 'AO_USDT', mexcSymbol: 'AO_USDT', gateioFuturesSymbol: 'AO_USDT', mexcFuturesSymbol: 'AO_USDT' },
    { baseSymbol: 'EDGE', gateioSymbol: 'EDGE_USDT', mexcSymbol: 'EDGE_USDT', gateioFuturesSymbol: 'EDGE_USDT', mexcFuturesSymbol: 'EDGE_USDT' },
    { baseSymbol: 'FARM', gateioSymbol: 'FARM_USDT', mexcSymbol: 'FARM_USDT', gateioFuturesSymbol: 'FARM_USDT', mexcFuturesSymbol: 'FARM_USDT' },
    { baseSymbol: 'VVAIFU', gateioSymbol: 'VVAIFU_USDT', mexcSymbol: 'VVAIFU_USDT', gateioFuturesSymbol: 'VVAIFU_USDT', mexcFuturesSymbol: 'VVAIFU_USDT' },
    { baseSymbol: 'PEPECOIN', gateioSymbol: 'PEPECOIN_USDT', mexcSymbol: 'PEPECOIN_USDT', gateioFuturesSymbol: 'PEPECOIN_USDT', mexcFuturesSymbol: 'PEPECOIN_USDT' },
    { baseSymbol: 'TREAT', gateioSymbol: 'TREAT_USDT', mexcSymbol: 'TREAT_USDT', gateioFuturesSymbol: 'TREAT_USDT', mexcFuturesSymbol: 'TREAT_USDT' },
    { baseSymbol: 'ALPACA', gateioSymbol: 'ALPACA_USDT', mexcSymbol: 'ALPACA_USDT', gateioFuturesSymbol: 'ALPACA_USDT', mexcFuturesSymbol: 'ALPACA_USDT' },
    { baseSymbol: 'RBNT', gateioSymbol: 'RBNT_USDT', mexcSymbol: 'RBNT_USDT', gateioFuturesSymbol: 'RBNT_USDT', mexcFuturesSymbol: 'RBNT_USDT' },
    { baseSymbol: 'TOMI', gateioSymbol: 'TOMI_USDT', mexcSymbol: 'TOMI_USDT', gateioFuturesSymbol: 'TOMI_USDT', mexcFuturesSymbol: 'TOMI_USDT' },
    { baseSymbol: 'LUCE', gateioSymbol: 'LUCE_USDT', mexcSymbol: 'LUCE_USDT', gateioFuturesSymbol: 'LUCE_USDT', mexcFuturesSymbol: 'LUCE_USDT' },
    { baseSymbol: 'WAXP', gateioSymbol: 'WAXP_USDT', mexcSymbol: 'WAXP_USDT', gateioFuturesSymbol: 'WAXP_USDT', mexcFuturesSymbol: 'WAXP_USDT' },
    { baseSymbol: 'NAVX', gateioSymbol: 'NAVX_USDT', mexcSymbol: 'NAVX_USDT', gateioFuturesSymbol: 'NAVX_USDT', mexcFuturesSymbol: 'NAVX_USDT' },
    { baseSymbol: 'WHITE', gateioSymbol: 'WHITE_USDT', mexcSymbol: 'WHITE_USDT', gateioFuturesSymbol: 'WHITE_USDT', mexcFuturesSymbol: 'WHITE_USDT' },
    { baseSymbol: 'RIFSOL', gateioSymbol: 'RIFSOL_USDT', mexcSymbol: 'RIFSOL_USDT', gateioFuturesSymbol: 'RIFSOL_USDT', mexcFuturesSymbol: 'RIFSOL_USDT' },
    { baseSymbol: 'ALCX', gateioSymbol: 'ALCX_USDT', mexcSymbol: 'ALCX_USDT', gateioFuturesSymbol: 'ALCX_USDT', mexcFuturesSymbol: 'ALCX_USDT' },
    { baseSymbol: 'GORK', gateioSymbol: 'GORK_USDT', mexcSymbol: 'GORK_USDT', gateioFuturesSymbol: 'GORK_USDT', mexcFuturesSymbol: 'GORK_USDT' },
    { baseSymbol: 'ALPINE', gateioSymbol: 'ALPINE_USDT', mexcSymbol: 'ALPINE_USDT', gateioFuturesSymbol: 'ALPINE_USDT', mexcFuturesSymbol: 'ALPINE_USDT' },
    { baseSymbol: 'CITY', gateioSymbol: 'CITY_USDT', mexcSymbol: 'CITY_USDT', gateioFuturesSymbol: 'CITY_USDT', mexcFuturesSymbol: 'CITY_USDT' },
    { baseSymbol: 'ILV', gateioSymbol: 'ILV_USDT', mexcSymbol: 'ILV_USDT', gateioFuturesSymbol: 'ILV_USDT', mexcFuturesSymbol: 'ILV_USDT' },
    { baseSymbol: 'CATTON', gateioSymbol: 'CATTON_USDT', mexcSymbol: 'CATTON_USDT', gateioFuturesSymbol: 'CATTON_USDT', mexcFuturesSymbol: 'CATTON_USDT' },
    { baseSymbol: 'ORAI', gateioSymbol: 'ORAI_USDT', mexcSymbol: 'ORAI_USDT', gateioFuturesSymbol: 'ORAI_USDT', mexcFuturesSymbol: 'ORAI_USDT' },
    { baseSymbol: 'HOLD', gateioSymbol: 'HOLD_USDT', mexcSymbol: 'HOLD_USDT', gateioFuturesSymbol: 'HOLD_USDT', mexcFuturesSymbol: 'HOLD_USDT' },
    { baseSymbol: 'SYS', gateioSymbol: 'SYS_USDT', mexcSymbol: 'SYS_USDT', gateioFuturesSymbol: 'SYS_USDT', mexcFuturesSymbol: 'SYS_USDT' },
    { baseSymbol: 'POND', gateioSymbol: 'POND_USDT', mexcSymbol: 'POND_USDT', gateioFuturesSymbol: 'POND_USDT', mexcFuturesSymbol: 'POND_USDT' },
    { baseSymbol: 'SPEC', gateioSymbol: 'SPEC_USDT', mexcSymbol: 'SPEC_USDT', gateioFuturesSymbol: 'SPEC_USDT', mexcFuturesSymbol: 'SPEC_USDT' },
    { baseSymbol: 'LAVA', gateioSymbol: 'LAVA_USDT', mexcSymbol: 'LAVA_USDT', gateioFuturesSymbol: 'LAVA_USDT', mexcFuturesSymbol: 'LAVA_USDT' },
    { baseSymbol: 'MAT', gateioSymbol: 'MAT_USDT', mexcSymbol: 'MAT_USDT', gateioFuturesSymbol: 'MAT_USDT', mexcFuturesSymbol: 'MAT_USDT' },
    { baseSymbol: 'LUNAI', gateioSymbol: 'LUNAI_USDT', mexcSymbol: 'LUNAI_USDT', gateioFuturesSymbol: 'LUNAI_USDT', mexcFuturesSymbol: 'LUNAI_USDT' },
    { baseSymbol: 'MORE', gateioSymbol: 'MORE_USDT', mexcSymbol: 'MORE_USDT', gateioFuturesSymbol: 'MORE_USDT', mexcFuturesSymbol: 'MORE_USDT' },
    { baseSymbol: 'MGO', gateioSymbol: 'MGO_USDT', mexcSymbol: 'MGO_USDT', gateioFuturesSymbol: 'MGO_USDT', mexcFuturesSymbol: 'MGO_USDT' },
    { baseSymbol: 'GROK', gateioSymbol: 'GROK_USDT', mexcSymbol: 'GROK_USDT', gateioFuturesSymbol: 'GROK_USDT', mexcFuturesSymbol: 'GROK_USDT' }
];
async function getTradablePairs() {
    // Usar lista estática em vez de banco de dados
    return STATIC_PAIRS;
}
// Função para processar mensagens WebSocket e atualizar preços
function processWebSocketMessage(exchange, message) {
    // VALIDAÇÃO: Rejeitar dados fictícios ou de teste
    if (!message || typeof message !== 'object') {
        return;
    }
    // Verificar se a mensagem contém dados válidos
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
                priceData['gateio_spot'][symbol] = {
                    bestAsk,
                    bestBid,
                    timestamp: Date.now()
                };
                console.log(`[GATEIO SPOT] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
            }
        }
        // Processa mensagens do MEXC Spot
        else if (exchange === 'MEXC Spot' && message.c && message.c.includes('spot.ticker')) {
            symbol = message.s;
            bestAsk = parseFloat(message.a);
            bestBid = parseFloat(message.b);
            if (symbol && bestAsk > 0 && bestBid > 0) {
                priceData['mexc_spot'][symbol] = {
                    bestAsk,
                    bestBid,
                    timestamp: Date.now()
                };
                console.log(`[MEXC SPOT] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
            }
        }
        // Processa mensagens do Gate.io Futures
        else if (exchange === 'Gate.io Futures' && message.channel === 'futures.tickers' && message.result) {
            symbol = message.result.contract;
            bestAsk = parseFloat(message.result.lowest_ask);
            bestBid = parseFloat(message.result.highest_bid);
            if (symbol && bestAsk > 0 && bestBid > 0) {
                priceData['gateio_futures'][symbol] = {
                    bestAsk,
                    bestBid,
                    timestamp: Date.now()
                };
                console.log(`[GATEIO FUTURES] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
            }
        }
        // Processa mensagens do MEXC Futures
        else if (exchange === 'MEXC Futures' && message.channel === 'push.ticker' && message.data) {
            symbol = message.symbol;
            bestAsk = parseFloat(message.data.ask1);
            bestBid = parseFloat(message.data.bid1);
            if (symbol && bestAsk > 0 && bestBid > 0) {
                priceData['mexc_futures'][symbol] = {
                    bestAsk,
                    bestBid,
                    timestamp: Date.now()
                };
                console.log(`[MEXC FUTURES] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
            }
        }
    }
    catch (error) {
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
            // Verifica se temos dados suficientes
            if (!gateioSpot || !mexcFutures) {
                console.log(`[Worker] Dados insuficientes para ${symbol}: Gate.io=${!!gateioSpot}, MEXC=${!!mexcFutures}`);
                continue;
            }
            // ESTRATÉGIA: COMPRAR Gate.io SPOT, VENDER MEXC FUTURES
            const spotPrice = gateioSpot.bestAsk; // Preço de compra no spot
            const futuresPrice = mexcFutures.bestBid; // Preço de venda no futures
            if (spotPrice > 0 && futuresPrice > 0) {
                // Fórmula: spread (%) = ((preço futuro - preço spot) / preço spot) × 100
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
        }
        catch (error) {
            console.error(`[Worker] Erro ao calcular oportunidade para ${symbol}:`, error);
        }
    }
    console.log(`[Worker] Total de oportunidades encontradas: ${opportunities.length}`);
    return opportunities;
}
// Função para salvar oportunidades no banco
async function saveOpportunities(opportunities) {
    // VALIDAÇÃO: Filtrar apenas oportunidades reais
    const realOpportunities = opportunities.filter(opp => {
        // Rejeitar dados de teste
        if (opp.baseSymbol.includes('TEST') || opp.baseSymbol.includes('test')) {
            console.log(`[Worker] Rejeitando oportunidade de teste: ${opp.baseSymbol}`);
            return false;
        }
        // Validar preços reais
        if (opp.buyAt.price <= 0 || opp.sellAt.price <= 0) {
            console.log(`[Worker] Rejeitando oportunidade com preços inválidos: ${opp.baseSymbol}`);
            return false;
        }
        return true;
    });
    if (realOpportunities.length === 0) {
        console.log('[Worker] Nenhuma oportunidade real para salvar');
        return;
    }
    if (!prisma) {
        console.log('[Worker] Prisma não inicializado');
        return;
    }
    try {
        for (const opportunity of realOpportunities) {
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
        }
        console.log(`[Worker] 💾 ${realOpportunities.length} oportunidades salvas no banco`);
    }
    catch (error) {
        console.error('[Worker] Erro ao salvar oportunidades:', error);
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
        // Calcula oportunidades de arbitragem
        const opportunities = calculateArbitrageOpportunities();
        if (opportunities.length > 0) {
            console.log(`[Worker] Geradas ${opportunities.length} oportunidades válidas`);
            // Salva no banco
            await saveOpportunities(opportunities);
            // Envia via WebSocket IMEDIATAMENTE
            for (const opportunity of opportunities) {
                console.log(`[Worker] ✅ Oportunidade enviada: ${opportunity.baseSymbol} - ${opportunity.profitPercentage.toFixed(4)}% - Spot: ${opportunity.buyAt.price} - Futures: ${opportunity.sellAt.price}`);
                // Broadcast imediato para todos os clientes
                broadcastToClients(opportunity);
            }
            // Enviar heartbeat para clientes
            broadcastToClients({
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                message: `Worker ativo - ${opportunities.length} oportunidades encontradas`,
                updateInterval: MONITORING_INTERVAL / 1000
            });
        }
    }
    catch (error) {
        console.error('[Worker] Erro no monitoramento:', error);
    }
    finally {
        isWorkerRunning = false;
    }
}
// Função principal que mantém o worker rodando
async function startWorker() {
    console.log('[Worker] Iniciando worker em segundo plano...');
    // Inicializa o Prisma (banco de dados)
    await initializePrisma();
    // Inicializa o servidor WebSocket
    initializeWebSocketServer();
    // Inicializa as conexões WebSocket
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
    if (gateioWs)
        gateioWs.close();
    if (mexcFuturesWs)
        mexcFuturesWs.close();
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
    if (gateioWs)
        gateioWs.close();
    if (mexcFuturesWs)
        mexcFuturesWs.close();
    if (wss) {
        wss.close();
    }
    if (prisma) {
        await prisma.$disconnect();
    }
    process.exit(0);
});
// Inicia o worker
startWorker().catch(error => {
    console.error('[Worker] Erro fatal:', error);
    process.exit(1);
});
