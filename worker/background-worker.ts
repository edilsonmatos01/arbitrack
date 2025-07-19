// WORKER COM SERVIDOR HTTP E WEBSOCKET PARA RENDER
// Este arquivo é um BACKGROUND WORKER com servidor HTTP e WebSocket para o Render

import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import * as WebSocket from 'ws';
import { getMonitoredPairs, MONITORING_CONFIG } from '../lib/predefined-pairs';

// Importar conectores da versão anterior que funcionavam
import { GateioConnector } from '../src/gateio-connector';
import { MexcConnector } from '../src/mexc-connector';

// Configurações
const MONITORING_INTERVAL = 10 * 1000; // 10 segundos para atualizações em tempo real
const PORT = process.env.PORT || 10000;
let isWorkerRunning = false;
let isShuttingDown = false;
let prisma: PrismaClient | null = null;
let wss: any = null;
let connectedClients: WebSocket[] = [];

// Estado dos preços de mercado
let marketPrices: any = {};

// Função para inicializar o Prisma
async function initializePrisma(): Promise<void> {
  console.log('[Worker] Inicializando conexão com banco de dados...');
  let retryCount = 0;
  const maxRetries = 3;
  
  while (!isShuttingDown && retryCount < maxRetries) {
    try {
      if (!prisma) {
        prisma = new PrismaClient();
        await prisma.$connect();
        console.log('[Worker] Conexão com o banco de dados estabelecida');
        break;
      }
    } catch (error) {
      retryCount++;
      console.error(`[Worker] Erro ao conectar com o banco (tentativa ${retryCount}/${maxRetries}):`, error);
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        console.log('[Worker] Continuando sem banco de dados');
      }
    }
  }
}

// Função para enviar dados via WebSocket
function broadcastToClients(data: any): void {
  if (connectedClients.length === 0) return;
  
  const message = JSON.stringify(data);
  connectedClients.forEach((client, index) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    } else {
      // Remove clientes desconectados
      connectedClients.splice(index, 1);
    }
  });
}

// Função para lidar com atualizações de preço dos conectores
function handlePriceUpdate(update: any) {
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
async function generateArbitrageOpportunities(): Promise<any[]> {
  const monitoredPairs = getMonitoredPairs();
  const opportunities: any[] = [];

  try {
    console.log(`[Worker] Gerando oportunidades para ${monitoredPairs.length} pares...`);

    for (const symbol of monitoredPairs) {
      const gateioData = marketPrices['gateio']?.[symbol];
      const mexcData = marketPrices['mexc']?.[symbol];

      if (!gateioData || !mexcData) continue;

      // Verifica se os preços são válidos
      if (!isFinite(gateioData.bestAsk) || !isFinite(gateioData.bestBid) ||
          !isFinite(mexcData.bestAsk) || !isFinite(mexcData.bestBid)) {
        continue;
      }

      // Calcula oportunidades de arbitragem
      const gateioToMexc = ((mexcData.bestBid - gateioData.bestAsk) / gateioData.bestAsk) * 100;
      const mexcToGateio = ((gateioData.bestBid - mexcData.bestAsk) / mexcData.bestAsk) * 100;

      // Processa oportunidade Gate.io SPOT -> MEXC FUTURES
      if (gateioToMexc >= MONITORING_CONFIG.minSpreadThreshold && 
          gateioToMexc <= MONITORING_CONFIG.maxSpreadThreshold) {
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
      if (mexcToGateio >= MONITORING_CONFIG.minSpreadThreshold && 
          mexcToGateio <= MONITORING_CONFIG.maxSpreadThreshold) {
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

  } catch (error) {
    console.error('[Worker] Erro ao gerar oportunidades:', error);
    return [];
  }
}

// Função principal de monitoramento
async function monitorAndStore(): Promise<void> {
  if (isWorkerRunning) {
    return;
  }

  try {
    isWorkerRunning = true;
    console.log(`[Worker ${new Date().toLocaleTimeString()}] Monitoramento ativo - Gerando oportunidades reais`);
    
    // Gerar oportunidades reais
    const realOpportunities = await generateArbitrageOpportunities();
    
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
      monitoredPairs: getMonitoredPairs().length,
      updateInterval: MONITORING_INTERVAL / 1000
    });
    
  } catch (error) {
    console.error('[Worker] Erro no monitoramento:', error);
  } finally {
    isWorkerRunning = false;
  }
}

// Função para iniciar os conectores
async function startConnectors(): Promise<void> {
  console.log('[Worker] Iniciando conectores...');
  
  try {
    const gateio = new GateioConnector();
    const mexc = new MexcConnector();

    // Configurar callbacks de atualização de preço
    gateio.onPriceUpdate(handlePriceUpdate);
    mexc.onPriceUpdate(handlePriceUpdate);

    // Conectar aos feeds
    await gateio.connect();
    await mexc.connect();

    console.log('[Worker] ✅ Conectores iniciados com sucesso');
    
  } catch (error) {
    console.error('[Worker] Erro ao iniciar conectores:', error);
  }
}

// Criar servidor HTTP e WebSocket
function createServer(): http.Server {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'Worker ativo',
      timestamp: new Date().toISOString(),
      message: 'Servidor worker funcionando corretamente',
      websocketClients: connectedClients.length,
      monitoredPairs: getMonitoredPairs().length,
      updateInterval: MONITORING_INTERVAL / 1000 + ' segundos'
    }));
  });

  // Criar servidor WebSocket
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Novo cliente conectado');
    connectedClients.push(ws);
    
    // Enviar mensagem de boas-vindas
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Conectado ao servidor de arbitragem em tempo real',
      timestamp: new Date().toISOString(),
      monitoredPairs: getMonitoredPairs().length
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
async function startWorker(): Promise<void> {
  console.log('🚀 Iniciando worker de arbitragem em tempo real...');
  console.log(`📊 Pares monitorados: ${getMonitoredPairs().length}`);
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
    
  } catch (error) {
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