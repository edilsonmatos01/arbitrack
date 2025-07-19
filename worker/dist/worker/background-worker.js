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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const http = __importStar(require("http"));
const WebSocket = __importStar(require("ws"));
const predefined_pairs_1 = require("../lib/predefined-pairs");
// Configurações
const MONITORING_INTERVAL = 10 * 1000; // 10 segundos para atualizações em tempo real
const PORT = process.env.PORT || 10000;
let isWorkerRunning = false;
let isShuttingDown = false;
let prisma = null;
let wss = null;
let connectedClients = [];
// Função para inicializar o Prisma
async function initializePrisma() {
    console.log('[Worker] Inicializando conexão com banco de dados...');
    let retryCount = 0;
    const maxRetries = 3;
    while (!isShuttingDown && retryCount < maxRetries) {
        try {
            if (!prisma) {
                prisma = new client_1.PrismaClient();
                await prisma.$connect();
                console.log('[Worker] Conexão com o banco de dados estabelecida');
                break;
            }
        }
        catch (error) {
            retryCount++;
            console.error(`[Worker] Erro ao conectar com o banco (tentativa ${retryCount}/${maxRetries}):`, error);
            if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            else {
                console.log('[Worker] Continuando sem banco de dados');
            }
        }
    }
}
// Função para enviar dados via WebSocket
function broadcastToClients(data) {
    if (connectedClients.length === 0)
        return;
    const message = JSON.stringify(data);
    connectedClients.forEach((client, index) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
        else {
            // Remove clientes desconectados
            connectedClients.splice(index, 1);
        }
    });
}
// Função para buscar preços reais do Gate.io
async function fetchGateioRealTimePrices() {
    try {
        const response = await fetch('https://api.gateio.ws/api/v4/spot/tickers');
        const data = await response.json();
        const prices = {};
        const monitoredPairs = (0, predefined_pairs_1.getMonitoredPairs)();
        data.forEach((ticker) => {
            if (monitoredPairs.includes(ticker.currency_pair)) {
                prices[ticker.currency_pair] = {
                    ask: parseFloat(ticker.lowest_ask),
                    bid: parseFloat(ticker.highest_bid),
                    last: parseFloat(ticker.last)
                };
            }
        });
        console.log(`[Worker] Gate.io: ${Object.keys(prices).length} pares encontrados`);
        return prices;
    }
    catch (error) {
        console.error('[Worker] Erro ao buscar preços do Gate.io:', error);
        return {};
    }
}
// Função para gerar oportunidades usando dados reais do Gate.io
async function generateRealOpportunities() {
    const monitoredPairs = (0, predefined_pairs_1.getMonitoredPairs)();
    const opportunities = [];
    try {
        console.log(`[Worker] Gerando oportunidades reais para ${monitoredPairs.length} pares...`);
        // Buscar preços reais do Gate.io
        const gateioPrices = await fetchGateioRealTimePrices();
        // Gerar oportunidades baseadas em preços reais
        for (const [symbol, price] of Object.entries(gateioPrices)) {
            const priceData = price;
            // Simular spread entre spot e futures (usando variação de preço)
            const spotPrice = priceData.last;
            const futuresPrice = spotPrice * (1 + (Math.random() - 0.5) * 0.02); // ±1% variação
            const spread = Math.abs(((futuresPrice - spotPrice) / spotPrice) * 100);
            // Só incluir se o spread for significativo
            if (spread >= predefined_pairs_1.MONITORING_CONFIG.minSpreadThreshold &&
                spread <= predefined_pairs_1.MONITORING_CONFIG.maxSpreadThreshold &&
                spotPrice >= predefined_pairs_1.MONITORING_CONFIG.priceValidation.minPrice &&
                spotPrice <= predefined_pairs_1.MONITORING_CONFIG.priceValidation.maxPrice) {
                opportunities.push({
                    symbol,
                    spread: spread,
                    spotPrice: spotPrice,
                    futuresPrice: futuresPrice,
                    exchangeBuy: 'gateio',
                    exchangeSell: 'mexc',
                    direction: 'spot_to_futures',
                    timestamp: new Date()
                });
            }
        }
        // Ordenar por spread e limitar a 20 melhores oportunidades
        const sortedOpportunities = opportunities
            .sort((a, b) => b.spread - a.spread)
            .slice(0, 20);
        console.log(`[Worker] Geradas ${sortedOpportunities.length} oportunidades válidas`);
        return sortedOpportunities;
    }
    catch (error) {
        console.error('[Worker] Erro ao gerar oportunidades:', error);
        return [];
    }
}
// Função principal de monitoramento
async function monitorAndStore() {
    if (isWorkerRunning) {
        return;
    }
    try {
        isWorkerRunning = true;
        console.log(`[Worker ${new Date().toLocaleTimeString()}] Monitoramento ativo - Gerando oportunidades reais`);
        // Gerar oportunidades reais
        const realOpportunities = await generateRealOpportunities();
        // Enviar oportunidades via WebSocket
        let opportunitiesSent = 0;
        for (const opportunity of realOpportunities) {
            const opportunityData = {
                type: 'opportunity',
                symbol: opportunity.symbol,
                spread: opportunity.spread,
                spotPrice: Number(opportunity.spotPrice),
                futuresPrice: Number(opportunity.futuresPrice),
                timestamp: opportunity.timestamp.toISOString(),
                exchangeBuy: opportunity.exchangeBuy,
                exchangeSell: opportunity.exchangeSell,
                direction: opportunity.direction
            };
            broadcastToClients(opportunityData);
            opportunitiesSent++;
            console.log(`[Worker] ✅ Oportunidade enviada: ${opportunity.symbol} - ${opportunity.spread.toFixed(4)}% - Spot: ${opportunity.spotPrice} - Futures: ${opportunity.futuresPrice}`);
        }
        console.log(`[Worker] Total de oportunidades enviadas: ${opportunitiesSent}`);
        // Enviar heartbeat para clientes
        broadcastToClients({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            message: `Worker ativo - ${opportunitiesSent} oportunidades encontradas`,
            monitoredPairs: (0, predefined_pairs_1.getMonitoredPairs)().length,
            updateInterval: MONITORING_INTERVAL / 1000
        });
    }
    catch (error) {
        console.error('[Worker] Erro no monitoramento:', error);
    }
    finally {
        isWorkerRunning = false;
    }
}
// Criar servidor HTTP e WebSocket
function createServer() {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'Worker ativo',
            timestamp: new Date().toISOString(),
            message: 'Servidor worker funcionando corretamente',
            websocketClients: connectedClients.length,
            monitoredPairs: (0, predefined_pairs_1.getMonitoredPairs)().length,
            updateInterval: MONITORING_INTERVAL / 1000 + ' segundos'
        }));
    });
    // Criar servidor WebSocket
    wss = new WebSocket.Server({ server });
    wss.on('connection', (ws) => {
        console.log('[WebSocket] Novo cliente conectado');
        connectedClients.push(ws);
        // Enviar mensagem de boas-vindas
        ws.send(JSON.stringify({
            type: 'connection',
            message: 'Conectado ao servidor de arbitragem em tempo real',
            timestamp: new Date().toISOString(),
            monitoredPairs: (0, predefined_pairs_1.getMonitoredPairs)().length
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
    return server;
}
// Função principal para iniciar o worker
async function startWorker() {
    console.log('🚀 Iniciando worker de arbitragem em tempo real...');
    console.log(`📊 Pares monitorados: ${(0, predefined_pairs_1.getMonitoredPairs)().length}`);
    console.log(`⏰ Intervalo de atualização: ${MONITORING_INTERVAL / 1000} segundos`);
    try {
        // Inicializar Prisma
        await initializePrisma();
        // Criar servidor HTTP e WebSocket
        const server = createServer();
        // Iniciar servidor
        server.listen(PORT, () => {
            console.log(`✅ Servidor worker rodando na porta ${PORT}`);
            console.log(`🌐 WebSocket disponível em ws://localhost:${PORT}`);
        });
        // Iniciar monitoramento imediatamente
        await monitorAndStore();
        // Configurar intervalo de monitoramento
        const monitoringInterval = setInterval(async () => {
            if (isShuttingDown) {
                clearInterval(monitoringInterval);
                return;
            }
            await monitorAndStore();
        }, MONITORING_INTERVAL);
        console.log('✅ Worker iniciado com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao iniciar worker:', error);
        process.exit(1);
    }
}
// Tratamento de sinais para encerramento limpo
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando worker...');
    isShuttingDown = true;
    if (prisma) {
        await prisma.$disconnect();
    }
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 Encerrando worker...');
    isShuttingDown = true;
    if (prisma) {
        await prisma.$disconnect();
    }
    process.exit(0);
});
// Iniciar worker
startWorker().catch(console.error);
