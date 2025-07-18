// WORKER COM SERVIDOR HTTP E WEBSOCKET PARA RENDER
// Este arquivo é um BACKGROUND WORKER com servidor HTTP e WebSocket para o Render

import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import * as WebSocket from 'ws';
import { getMonitoredPairs, MONITORING_CONFIG } from '../lib/predefined-pairs';

// Configurações
const MONITORING_INTERVAL = 10 * 1000; // 10 segundos para atualizações em tempo real
const PORT = process.env.PORT || 10000;
let isWorkerRunning = false;
let isShuttingDown = false;
let prisma: PrismaClient | null = null;
let wss: any = null;
let connectedClients: WebSocket[] = [];

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

// Função para buscar preços reais do Gate.io
async function fetchGateioRealTimePrices(): Promise<any> {
  try {
    const response = await fetch('https://api.gateio.ws/api/v4/spot/tickers');
    const data = await response.json() as any[];
    
    const prices: any = {};
    const monitoredPairs = getMonitoredPairs();
    
    data.forEach((ticker: any) => {
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
  } catch (error) {
    console.error('[Worker] Erro ao buscar preços do Gate.io:', error);
    return {};
  }
}

// Função para buscar dados reais das exchanges e banco
async function fetchRealTimeOpportunities(): Promise<any[]> {
  const monitoredPairs = getMonitoredPairs();
  const opportunities: any[] = [];

  try {
    console.log(`[Worker] Buscando oportunidades em tempo real para ${monitoredPairs.length} pares...`);

    // Buscar preços reais do Gate.io
    const gateioPrices = await fetchGateioRealTimePrices();
    
    // Buscar dados históricos válidos do banco para completar as oportunidades
    if (prisma) {
      const recentData = await prisma.spreadHistory.findMany({
        where: {
          symbol: { in: monitoredPairs },
          spotPrice: { gt: 0 },
          futuresPrice: { gt: 0 },
          timestamp: {
            gte: new Date(Date.now() - 30 * 60 * 1000) // Últimos 30 minutos
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      });

      console.log(`[Worker] Encontrados ${recentData.length} registros recentes no banco`);

      // Processar dados do Gate.io com dados históricos
      for (const [symbol, gateioPrice] of Object.entries(gateioPrices)) {
        // Buscar dados históricos para este símbolo
        const historicalData = recentData.filter(d => d.symbol === symbol);
        
        if (historicalData.length > 0) {
          const latestData = historicalData[0];
          const price = gateioPrice as { last: number; ask: number; bid: number };
          
          // Criar oportunidade usando preço real do Gate.io e dados históricos
          const spread = ((price.last - latestData.spotPrice) / latestData.spotPrice) * 100;
          
          if (Math.abs(spread) >= MONITORING_CONFIG.minSpreadThreshold && 
              Math.abs(spread) <= MONITORING_CONFIG.maxSpreadThreshold) {
            
                         opportunities.push({
               symbol,
               spread: Math.abs(spread),
               spotPrice: price.last, // Preço real do Gate.io
               futuresPrice: latestData.futuresPrice, // Dados históricos
               exchangeBuy: spread > 0 ? 'gateio' : latestData.exchangeBuy,
               exchangeSell: spread > 0 ? latestData.exchangeSell : 'gateio',
               direction: 'spot_to_futures',
               timestamp: new Date()
             });
          }
        }
      }

      // Também incluir oportunidades baseadas apenas em dados históricos válidos
      for (const data of recentData.slice(0, 20)) {
        if (data.spread >= MONITORING_CONFIG.minSpreadThreshold && 
            data.spread <= MONITORING_CONFIG.maxSpreadThreshold &&
            data.spotPrice >= MONITORING_CONFIG.priceValidation.minPrice &&
            data.spotPrice <= MONITORING_CONFIG.priceValidation.maxPrice &&
            data.futuresPrice >= MONITORING_CONFIG.priceValidation.minPrice &&
            data.futuresPrice <= MONITORING_CONFIG.priceValidation.maxPrice) {
          
          opportunities.push({
            symbol: data.symbol,
            spread: data.spread,
            spotPrice: data.spotPrice,
            futuresPrice: data.futuresPrice,
            exchangeBuy: data.exchangeBuy,
            exchangeSell: data.exchangeSell,
            direction: data.direction,
            timestamp: data.timestamp
          });
        }
      }
    }

    // Remover duplicatas e ordenar por spread
    const uniqueOpportunities = opportunities
      .filter((opp, index, self) => 
        index === self.findIndex(o => o.symbol === opp.symbol)
      )
      .sort((a, b) => b.spread - a.spread)
      .slice(0, 20); // Limitar a 20 melhores oportunidades

    console.log(`[Worker] Encontradas ${uniqueOpportunities.length} oportunidades válidas`);
    return uniqueOpportunities;

  } catch (error) {
    console.error('[Worker] Erro ao buscar oportunidades em tempo real:', error);
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
    console.log(`[Worker ${new Date().toLocaleTimeString()}] Monitoramento ativo - Buscando dados em tempo real`);
    
    // Buscar oportunidades em tempo real
    const realTimeOpportunities = await fetchRealTimeOpportunities();
    
    // Enviar oportunidades via WebSocket
    let opportunitiesSent = 0;
    for (const opportunity of realTimeOpportunities) {
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