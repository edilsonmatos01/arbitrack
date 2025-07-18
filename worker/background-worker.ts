// WORKER COM SERVIDOR HTTP E WEBSOCKET PARA RENDER
// Este arquivo é um BACKGROUND WORKER com servidor HTTP e WebSocket para o Render

import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import * as WebSocket from 'ws';

// Configurações
const MONITORING_INTERVAL = 60 * 1000; // 1 minuto
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

// Função principal de monitoramento
async function monitorAndStore(): Promise<void> {
  if (isWorkerRunning) {
    return;
  }

  try {
    isWorkerRunning = true;
    console.log(`[Worker ${new Date().toLocaleTimeString()}] Monitoramento ativo`);
    
    // Buscar dados reais do banco de dados
    if (prisma) {
      try {
        // Buscar spreads recentes do banco (últimas 2 horas)
        const recentSpreads = await prisma.spreadHistory.findMany({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Últimas 2h
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 20
        });

        console.log(`[Worker] Encontrados ${recentSpreads.length} spreads no banco`);

        // Enviar dados reais via WebSocket
        let opportunitiesSent = 0;
        for (const spread of recentSpreads) {
          console.log(`[Worker] Verificando spread: ${spread.symbol}`, {
            spread: spread.spread,
            spotPrice: spread.spotPrice,
            futuresPrice: spread.futuresPrice,
            exchangeBuy: spread.exchangeBuy,
            exchangeSell: spread.exchangeSell
          });
          
          // Validar se os preços são válidos
          if (spread.spread > 0.1 && 
              spread.spotPrice && spread.spotPrice > 0 && 
              spread.futuresPrice && spread.futuresPrice > 0) {
            
            const opportunityData = {
              type: 'opportunity',
              symbol: spread.symbol,
              spread: spread.spread,
              spotPrice: Number(spread.spotPrice),
              futuresPrice: Number(spread.futuresPrice),
              timestamp: spread.timestamp.toISOString(),
              exchangeBuy: spread.exchangeBuy,
              exchangeSell: spread.exchangeSell,
              direction: spread.direction
            };
            
            broadcastToClients(opportunityData);
            opportunitiesSent++;
            console.log(`[Worker] ✅ Oportunidade válida enviada: ${spread.symbol} - ${spread.spread.toFixed(4)}% - Spot: ${spread.spotPrice} - Futures: ${spread.futuresPrice}`);
          } else {
            console.log(`[Worker] ❌ Spread inválido ignorado: ${spread.symbol} - Spread: ${spread.spread} - Spot: ${spread.spotPrice} - Futures: ${spread.futuresPrice}`);
          }
        }
        
        console.log(`[Worker] Total de oportunidades enviadas: ${opportunitiesSent}`);
        
        // Se não há dados suficientes, buscar dados mais antigos
        if (opportunitiesSent === 0) {
          console.log(`[Worker] Nenhuma oportunidade recente, buscando dados mais antigos...`);
          const olderSpreads = await prisma.spreadHistory.findMany({
            orderBy: {
              timestamp: 'desc'
            },
            take: 10
          });
          
          for (const spread of olderSpreads) {
            const opportunityData = {
              type: 'opportunity',
              symbol: spread.symbol,
              spread: spread.spread,
              spotPrice: spread.spotPrice,
              futuresPrice: spread.futuresPrice,
              timestamp: spread.timestamp.toISOString(),
              exchangeBuy: spread.exchangeBuy,
              exchangeSell: spread.exchangeSell,
              direction: spread.direction
            };
            
            broadcastToClients(opportunityData);
            console.log(`[Worker] ✅ Oportunidade histórica enviada: ${spread.symbol} - ${spread.spread.toFixed(4)}%`);
          }
        }
      } catch (dbError) {
        console.error(`[Worker] Erro ao buscar dados do banco:`, dbError);
      }
    }
    
    // Enviar heartbeat para clientes
    broadcastToClients({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      message: 'Worker ativo - Dados reais'
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
      websocketClients: connectedClients.length
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
      message: 'Conectado ao servidor de arbitragem',
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

  server.listen(PORT, () => {
    console.log(`[Worker] Servidor HTTP e WebSocket iniciado na porta ${PORT}`);
  });

  return server;
}

// Função principal do worker
async function startWorker(): Promise<void> {
  console.log('[Worker] Iniciando worker com servidor HTTP e WebSocket...');
  
  // Inicializa o banco
  await initializePrisma();
  
  // Cria o servidor HTTP e WebSocket
  const server = createServer();
  
  console.log('[Worker] Worker iniciado com sucesso!');
  
  // Loop principal
  while (!isShuttingDown) {
    try {
      await monitorAndStore();
      await new Promise(resolve => setTimeout(resolve, MONITORING_INTERVAL));
    } catch (error) {
      console.error('[Worker] Erro no loop principal:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Fecha o servidor
  if (wss) {
    wss.close();
  }
  server.close();
}

// Tratamento de encerramento
process.on('SIGTERM', async () => {
  console.log('[Worker] Recebido SIGTERM, encerrando...');
  isShuttingDown = true;
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] Recebido SIGINT, encerrando...');
  isShuttingDown = true;
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

// Inicia o worker
console.log('[Worker] Iniciando...');
startWorker().catch(error => {
  console.error('[Worker] Erro fatal:', error);
  process.exit(1);
});