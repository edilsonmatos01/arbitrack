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
const spread_tracker_1 = require("../lib/spread-tracker");
// Importar conectores da versão anterior que funcionavam
const gateio_connector_1 = require("../src/gateio-connector");
const mexc_connector_1 = require("../src/mexc-connector");
// Configurações
const MONITORING_INTERVAL = 10 * 1000; // 10 segundos para atualizações em tempo real
const PORT = process.env.PORT || 10000;
let isWorkerRunning = false;
let isShuttingDown = false;
let prisma = null;
let wss = null;
let connectedClients = [];
// Estado dos preços de mercado
let marketPrices = {};
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
// Função para lidar com atualizações de preço dos conectores
function handlePriceUpdate(update) {
    const { identifier, symbol, marketType, bestAsk, bestBid } = update;
    // Atualiza o estado central de preços
    if (!marketPrices[identifier]) {
        marketPrices[identifier] = {};
    }
    marketPrices[identifier][symbol] = { bestAsk, bestBid, timestamp: Date.now() };
    // Transmite a atualização para todos os clientes
    broadcastToClients({
        type: 'price-update',
        symbol,
        marketType,
        bestAsk,
        bestBid
    });
}
// Função para gerar oportunidades de arbitragem
async function generateArbitrageOpportunities() {
    const monitoredPairs = (0, predefined_pairs_1.getMonitoredPairs)();
    const opportunities = [];
    try {
        console.log(`[Worker] Gerando oportunidades para ${monitoredPairs.length} pares...`);
        for (const symbol of monitoredPairs) {
            const gateioData = marketPrices['gateio']?.[symbol];
            const mexcData = marketPrices['mexc']?.[symbol];
            if (!gateioData || !mexcData)
                continue;
            // Verifica se os preços são válidos
            if (!isFinite(gateioData.bestAsk) || !isFinite(gateioData.bestBid) ||
                !isFinite(mexcData.bestAsk) || !isFinite(mexcData.bestBid)) {
                continue;
            }
            // Calcula oportunidades de arbitragem
            const gateioToMexc = ((mexcData.bestBid - gateioData.bestAsk) / gateioData.bestAsk) * 100;
            const mexcToGateio = ((gateioData.bestBid - mexcData.bestAsk) / mexcData.bestAsk) * 100;
            // Processa oportunidade Gate.io SPOT -> MEXC FUTURES
            if (gateioToMexc >= predefined_pairs_1.MONITORING_CONFIG.minSpreadThreshold &&
                gateioToMexc <= predefined_pairs_1.MONITORING_CONFIG.maxSpreadThreshold) {
                opportunities.push({
                    symbol,
                    spread: gateioToMexc,
                    spotPrice: gateioData.bestAsk,
                    futuresPrice: mexcData.bestBid,
                    exchangeBuy: 'gateio',
                    exchangeSell: 'mexc',
                    direction: 'spot_to_futures',
                    timestamp: new Date()
                });
            }
            // Processa oportunidade MEXC FUTURES -> Gate.io SPOT
            if (mexcToGateio >= predefined_pairs_1.MONITORING_CONFIG.minSpreadThreshold &&
                mexcToGateio <= predefined_pairs_1.MONITORING_CONFIG.maxSpreadThreshold) {
                opportunities.push({
                    symbol,
                    spread: mexcToGateio,
                    spotPrice: gateioData.bestBid,
                    futuresPrice: mexcData.bestAsk,
                    exchangeBuy: 'mexc',
                    exchangeSell: 'gateio',
                    direction: 'futures_to_spot',
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
        const realOpportunities = await generateArbitrageOpportunities();
        // Enviar oportunidades via WebSocket e salvar no banco
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
            // Salvar no banco de dados
            try {
                await (0, spread_tracker_1.recordSpread)({
                    symbol: opportunity.symbol,
                    exchangeBuy: opportunity.exchangeBuy,
                    exchangeSell: opportunity.exchangeSell,
                    direction: opportunity.direction === 'spot_to_futures' ? 'spot-to-future' : 'future-to-spot',
                    spread: opportunity.spread
                });
                console.log(`[Worker] 💾 Dados salvos no banco: ${opportunity.symbol} - ${opportunity.spread.toFixed(4)}%`);
            }
            catch (error) {
                console.error(`[Worker] ❌ Erro ao salvar no banco: ${opportunity.symbol}`, error);
            }
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
// Função para iniciar os conectores
async function startConnectors() {
    console.log('[Worker] Iniciando conectores...');
    try {
        const gateio = new gateio_connector_1.GateioConnector();
        const mexc = new mexc_connector_1.MexcConnector();
        // Configurar callbacks de atualização de preço
        gateio.onPriceUpdate(handlePriceUpdate);
        mexc.onPriceUpdate(handlePriceUpdate);
        // Conectar aos feeds
        await gateio.connect();
        await mexc.connect();
        console.log('[Worker] ✅ Conectores iniciados com sucesso');
    }
    catch (error) {
        console.error('[Worker] Erro ao iniciar conectores:', error);
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
        // Iniciar conectores
        await startConnectors();
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
