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
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/ws';
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
        method: "sub.contract.ticker",
        param: { symbol: symbol }
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
    return new Promise((resolve) => {
        const httpsUrl = url.replace('wss://', 'https://');
        https.get(httpsUrl, (res) => {
            if (res.statusCode === 307 || res.statusCode === 302 || res.statusCode === 301) {
                const newUrl = `wss://${res.headers.location?.replace('https://', '')}`;
                resolve(newUrl);
            }
            else {
                resolve(url);
            }
        }).on('error', (err) => {
            console.error(`[${name}] Erro ao verificar endpoint ${url}:`, err);
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
                    const checkedUrl = await checkEndpoint(url, name);
                    createWebSocket(checkedUrl, name);
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
let mexcWs;
let gateioFuturesWs;
let mexcFuturesWs;
// Função para inicializar as conexões WebSocket
async function initializeWebSockets() {
    try {
        gateioWs = await createWebSocket(GATEIO_WS_URL, 'Gate.io Spot');
        mexcWs = await createWebSocket(MEXC_WS_URL, 'MEXC Spot');
        gateioFuturesWs = await createWebSocket(GATEIO_FUTURES_WS_URL, 'Gate.io Futures');
        mexcFuturesWs = await createWebSocket(MEXC_FUTURES_WS_URL, 'MEXC Futures');
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
    wss = new ws_1.default.Server({ server });
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
async function getTradablePairs() {
    try {
        if (!prisma) {
            await initializePrisma();
            if (!prisma)
                return [];
        }
        return await prisma.$queryRaw `
      SELECT "baseSymbol", "gateioSymbol", "mexcSymbol", "gateioFuturesSymbol", "mexcFuturesSymbol"
      FROM "TradableSymbol"
      WHERE "isActive" = true
    `;
    }
    catch (error) {
        console.error('[Worker] Erro ao obter pares negociáveis:', error);
        return [];
    }
}
// Função para processar mensagens WebSocket e atualizar preços
function processWebSocketMessage(exchange, message) {
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
        else if (exchange === 'MEXC Futures' && message.c && message.c.includes('contract.ticker')) {
            symbol = message.s;
            bestAsk = parseFloat(message.a);
            bestBid = parseFloat(message.b);
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
    for (const symbol of symbols) {
        try {
            const gateioSpot = priceData['gateio_spot'][symbol];
            const mexcSpot = priceData['mexc_spot'][symbol];
            const gateioFutures = priceData['gateio_futures'][symbol];
            const mexcFutures = priceData['mexc_futures'][symbol];
            // Verifica se temos dados suficientes
            if (!gateioSpot || !mexcFutures)
                continue;
            // Calcula spread: Gate.io Spot -> MEXC Futures
            const spotPrice = gateioSpot.bestAsk; // Compra no spot
            const futuresPrice = mexcFutures.bestBid; // Venda no futures
            if (spotPrice > 0 && futuresPrice > 0) {
                const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
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
                    console.log(`[Worker] ✅ Oportunidade encontrada: ${symbol} - ${spread.toFixed(4)}%`);
                }
            }
            // Calcula spread: MEXC Spot -> Gate.io Futures
            if (mexcSpot && gateioFutures) {
                const spotPrice = mexcSpot.bestAsk; // Compra no spot
                const futuresPrice = gateioFutures.bestBid; // Venda no futures
                if (spotPrice > 0 && futuresPrice > 0) {
                    const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
                    if (spread >= MIN_SPREAD_THRESHOLD && spread <= MAX_SPREAD_THRESHOLD) {
                        const opportunity = {
                            type: 'arbitrage',
                            baseSymbol: symbol.replace('_USDT', ''),
                            profitPercentage: spread,
                            buyAt: {
                                exchange: 'mexc',
                                price: spotPrice,
                                marketType: 'spot'
                            },
                            sellAt: {
                                exchange: 'gateio',
                                price: futuresPrice,
                                marketType: 'futures'
                            },
                            arbitrageType: 'spot_to_futures',
                            timestamp: Date.now()
                        };
                        opportunities.push(opportunity);
                        console.log(`[Worker] ✅ Oportunidade encontrada: ${symbol} - ${spread.toFixed(4)}%`);
                    }
                }
            }
        }
        catch (error) {
            console.error(`[Worker] Erro ao calcular oportunidade para ${symbol}:`, error);
        }
    }
    return opportunities;
}
// Função para salvar oportunidades no banco
async function saveOpportunities(opportunities) {
    if (!prisma || opportunities.length === 0)
        return;
    try {
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
        }
        console.log(`[Worker] 💾 ${opportunities.length} oportunidades salvas no banco`);
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
    if (mexcWs)
        mexcWs.close();
    if (gateioFuturesWs)
        gateioFuturesWs.close();
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
    if (mexcWs)
        mexcWs.close();
    if (gateioFuturesWs)
        gateioFuturesWs.close();
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
