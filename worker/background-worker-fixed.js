// WORKER OTIMIZADO PARA ARBITRAGEM GATE.IO SPOT + MEXC FUTURES
// Este worker usa os conectores corrigidos para garantir conexões WebSocket estáveis

const WebSocket = require('ws');
const http = require('http');
const { GateioConnector } = require('../src/gateio-connector.js');
const { MexcFuturesConnector } = require('../src/mexc-futures-connector.js');

// Configurações
const WS_PORT = Number(process.env.PORT) || 10000;
const MONITORING_INTERVAL = 2000; // 2 segundos
const MIN_PROFIT_PERCENTAGE = 0.01; // Reduzido para detectar mais oportunidades
let isShuttingDown = false;

// Estado global
const marketPrices = {
    gateio: {},
    mexc: {}
};

let targetPairs = [];
let connectedClients = [];

// --- WEBSOCKET SERVER ---
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            clients: connectedClients.length,
            gateioSymbols: Object.keys(marketPrices.gateio).length,
            mexcSymbols: Object.keys(marketPrices.mexc).length
        }));
        return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
});

const wss = new WebSocket.Server({ 
    server,
    perMessageDeflate: false,
    clientTracking: true
});

wss.on('connection', (ws, request) => {
    console.log(`🔌 Nova conexão WebSocket de ${request.socket.remoteAddress}`);
    connectedClients.push(ws);
    
    ws.send(JSON.stringify({ 
        type: 'connection', 
        message: 'Conectado ao servidor de arbitragem em tempo real',
        timestamp: new Date().toISOString()
    }));
    
    console.log(`✅ Cliente conectado. Total: ${connectedClients.length}`);
    
    ws.on('close', (code, reason) => {
        console.log(`🔌 Cliente desconectado. Código: ${code}, Razão: ${reason}`);
        connectedClients = connectedClients.filter((c) => c !== ws);
        console.log(`📊 Total restante: ${connectedClients.length}`);
    });
    
    ws.on('error', (error) => {
        console.error(`❌ Erro no WebSocket do cliente:`, error);
        connectedClients = connectedClients.filter((c) => c !== ws);
    });
});

server.listen(WS_PORT, process.env.HOSTNAME || '0.0.0.0', () => {
    console.log(`✅ WebSocket server rodando na porta ${WS_PORT}`);
    console.log(`⏱️ Servidor iniciado em ${new Date().toISOString()}`);
});

// Função para broadcast de preços
function broadcastPriceUpdate(symbol, marketType, bestAsk, bestBid, identifier) {
    const message = {
        type: 'price-update',
        symbol: symbol,
        marketType: marketType,
        bestAsk: bestAsk,
        bestBid: bestBid,
        identifier: identifier,
        timestamp: Date.now()
    };
    
    // Log apenas para pares prioritários
    const priorityPairs = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'WHITE_USDT', 'MGO_USDT'];
    if (priorityPairs.includes(symbol)) {
        console.log(`[${identifier}] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
    }
    
    for (const client of connectedClients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    }
}

// Função para broadcast de oportunidades
function broadcastOpportunity(opportunity) {
    const message = {
        type: 'arbitrage',
        baseSymbol: opportunity.symbol,
        profitPercentage: opportunity.spread,
        buyAt: opportunity.buyAt,
        sellAt: opportunity.sellAt,
        arbitrageType: opportunity.arbitrageType,
        timestamp: Date.now()
    };
    
    console.log(`💰 OPORTUNIDADE: ${opportunity.symbol} - Spread: ${opportunity.spread.toFixed(4)}%`);
    
    for (const client of connectedClients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    }
}

// Função para processar atualizações de preço
function handlePriceUpdate(update) {
    const { identifier, symbol, marketType, bestAsk, bestBid } = update;
    
    // Atualizar estado global
    if (!marketPrices[identifier]) {
        marketPrices[identifier] = {};
    }
    
    marketPrices[identifier][symbol] = { 
        bestAsk, 
        bestBid, 
        timestamp: Date.now() 
    };
    
    // Broadcast para clientes
    broadcastPriceUpdate(symbol, marketType, bestAsk, bestBid, identifier);
}

// Função para calcular oportunidades de arbitragem
function findArbitrageOpportunities() {
    let opportunitiesFound = 0;
    let pairsChecked = 0;
    
    // Debug: verificar se targetPairs está definido
    if (!targetPairs || targetPairs.length === 0) {
        console.error('❌ TARGET PAIRS NÃO DEFINIDO OU VAZIO!');
        console.log('🔍 targetPairs:', targetPairs);
        return;
    }
    
    // Debug: verificar formatos dos dados recebidos
    const gateioSymbols = Object.keys(marketPrices.gateio || {});
    const mexcSymbols = Object.keys(marketPrices.mexc || {});
    
    if (pairsChecked === 0) { // Log apenas uma vez
        console.log(`🔍 DEBUG: Gate.io symbols recebidos: ${gateioSymbols.length}`);
        console.log(`🔍 DEBUG: MEXC symbols recebidos: ${mexcSymbols.length}`);
        console.log(`🔍 DEBUG: Primeiros 5 Gate.io: ${gateioSymbols.slice(0, 5).join(', ')}`);
        console.log(`🔍 DEBUG: Primeiros 5 MEXC: ${mexcSymbols.slice(0, 5).join(', ')}`);
        console.log(`🔍 DEBUG: Primeiros 5 targetPairs: ${targetPairs.slice(0, 5).join(', ')}`);
    }
    
    for (const symbol of targetPairs) {
        // CORREÇÃO: Converter formatos para compatibilidade
        const gateioSymbol = symbol; // Gate.io usa BTC_USDT
        const mexcSymbol = symbol.replace('_', '/'); // MEXC usa BTC/USDT
        
        const gateioData = marketPrices.gateio[gateioSymbol];
        const mexcData = marketPrices.mexc[mexcSymbol];
        
        if (!gateioData || !mexcData) {
            // Debug: verificar por que não encontrou os dados
            if (pairsChecked < 3) {
                console.log(`🔍 DEBUG: ${symbol} - Gate.io(${gateioSymbol}): ${!!gateioData}, MEXC(${mexcSymbol}): ${!!mexcData}`);
            }
            continue;
        }
        
        pairsChecked++;
        
        // Verificar se os preços são válidos
        if (!isFinite(gateioData.bestAsk) || !isFinite(gateioData.bestBid) ||
            !isFinite(mexcData.bestAsk) || !isFinite(mexcData.bestBid)) {
            continue;
        }
        
        // ESTRATÉGIA: Compra no Spot da Gate.io → Venda no Futures da MEXC
        // FÓRMULA: spread (%) = ((futuros - spot) / spot) × 100
        
        // Preço de compra: Gate.io Spot (bestAsk - preço mais alto para comprar)
        const spotPrice = gateioData.bestAsk;
        
        // Preço de venda: MEXC Futures (bestBid - preço mais baixo para vender)
        const futuresPrice = mexcData.bestBid;
        
        // Calcular spread usando a fórmula correta
        const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
        
        // Log de debug para alguns pares
        if (pairsChecked <= 5) {
            console.log(`🔍 DEBUG ${symbol}: Spot=${spotPrice}, Futures=${futuresPrice}, Spread=${spread.toFixed(4)}%`);
        }
        
        // Verificar se há oportunidade de lucro
        if (spread > MIN_PROFIT_PERCENTAGE && spread < 50) {
            const opportunity = {
                symbol: symbol,
                spread: spread,
                arbitrageType: 'gateio_spot_to_mexc_futures',
                strategy: 'Compra Spot Gate.io → Venda Futures MEXC',
                buyAt: {
                    exchange: 'gateio',
                    price: spotPrice,
                    marketType: 'spot',
                    action: 'COMPRAR'
                },
                sellAt: {
                    exchange: 'mexc',
                    price: futuresPrice,
                    marketType: 'futures',
                    action: 'VENDER'
                },
                profit: {
                    percentage: spread,
                    absolute: futuresPrice - spotPrice
                }
            };
            
            broadcastOpportunity(opportunity);
            opportunitiesFound++;
            
            // Log detalhado para oportunidades significativas
            if (spread > 0.5) {
                console.log(`💰 OPORTUNIDADE ENCONTRADA!`);
                console.log(`📊 ${symbol}: Spread = ${spread.toFixed(4)}%`);
                console.log(`🛒 Comprar: Gate.io Spot @ $${spotPrice}`);
                console.log(`💰 Vender: MEXC Futures @ $${futuresPrice}`);
                console.log(`📈 Lucro: ${spread.toFixed(4)}% ($${(futuresPrice - spotPrice).toFixed(6)})`);
                console.log(`---`);
            }
        }
    }
    
    // Log de debug a cada 10 ciclos
    if (Date.now() % 20000 < 2000) { // A cada ~20 segundos
        console.log(`🔍 DEBUG: Verificados ${pairsChecked} pares, ${opportunitiesFound} oportunidades encontradas`);
        console.log(`🔍 Total targetPairs: ${targetPairs.length}`);
    }
    
    if (opportunitiesFound > 0) {
        console.log(`💰 ${opportunitiesFound} oportunidades encontradas neste ciclo`);
    }
}

// Função principal para iniciar os conectores
async function startConnectors() {
    try {
        console.log('🚀 Iniciando conectores...');
        
        // Conector Gate.io Spot
        const gateioConnector = new GateioConnector();
        gateioConnector.onPriceUpdate(handlePriceUpdate);
        
        // Conector MEXC Futures
        const mexcConnector = new MexcFuturesConnector('mexc', handlePriceUpdate, () => {
            console.log('✅ MEXC conectado');
        });
        
        // Conectar aos serviços
        await gateioConnector.connect();
        await mexcConnector.connect();
        
        // Aguardar conexões se estabelecerem
        setTimeout(async () => {
            try {
                console.log('🔍 Iniciando configuração de pares...');
                
                // Obter pares da MEXC (lista pré-definida)
                const mexcPairs = await mexcConnector.getTradablePairs();
                console.log(`📊 MEXC retornou ${mexcPairs.length} pares`);
                console.log(`📊 Primeiros 5 pares MEXC: ${mexcPairs.slice(0, 5).join(', ')}`);
                
                // Obter pares da Gate.io (lista pré-definida)
                const gateioPairs = await gateioConnector.getSpotSymbols();
                console.log(`📊 Gate.io retornou ${gateioPairs.length} pares`);
                console.log(`📊 Primeiros 5 pares Gate.io: ${gateioPairs.slice(0, 5).join(', ')}`);
                
                // Encontrar pares comuns entre as duas listas
                const gateioFormatted = gateioPairs.map(symbol => symbol.replace('_', '/'));
                const commonPairs = mexcPairs.filter(symbol => gateioFormatted.includes(symbol));
                
                console.log(`🎯 Pares comuns encontrados: ${commonPairs.length}`);
                console.log(`🎯 Primeiros 10 pares comuns: ${commonPairs.slice(0, 10).join(', ')}`);
                
                if (commonPairs.length === 0) {
                    console.error('❌ NENHUM PAR COMUM ENCONTRADO! Verificando formatos...');
                    console.log('🔍 Formatos Gate.io:', gateioFormatted.slice(0, 10));
                    console.log('🔍 Formatos MEXC:', mexcPairs.slice(0, 10));
                    return;
                }
                
                // Inscrever nos pares comuns na MEXC
                mexcConnector.subscribe(commonPairs);
                
                // Definir target pairs (usar formato Gate.io para consistência)
                targetPairs = commonPairs.map(symbol => symbol.replace('/', '_'));
                
                console.log(`🎯 Target pairs definidos: ${targetPairs.length} pares`);
                console.log(`🎯 Pares principais: ${targetPairs.slice(0, 10).join(', ')}`);
                
                // Verificar se targetPairs foi definido corretamente
                if (targetPairs.length === 0) {
                    console.error('❌ TARGET PAIRS ESTÁ VAZIO!');
                    return;
                }
                
                // Iniciar monitoramento de arbitragem
                setInterval(findArbitrageOpportunities, MONITORING_INTERVAL);
                console.log(`⏱️ Monitoramento iniciado com intervalo de ${MONITORING_INTERVAL}ms`);
                
            } catch (error) {
                console.error('❌ Erro ao configurar pares:', error);
            }
        }, 8000); // Aumentado para 8 segundos
        
    } catch (error) {
        console.error('❌ Erro ao iniciar conectores:', error);
        process.exit(1);
    }
}

// Handlers de shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Recebido sinal de parada...');
    isShuttingDown = true;
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Recebido sinal de término...');
    isShuttingDown = true;
    process.exit(0);
});

// Iniciar o worker
console.log('🚀 Iniciando worker de arbitragem otimizado...');
console.log(`⏱️ Início: ${new Date().toISOString()}`);

// Aguardar um pouco antes de conectar
setTimeout(() => {
    startConnectors().catch((error) => {
        console.error('❌ Erro fatal na inicialização:', error);
        process.exit(1);
    });
}, 3000); 