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
    
    // Simular detecção de oportunidades
    const symbols = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];
    for (const symbol of symbols) {
      if (isShuttingDown) break;
      
      // Simular spread aleatório
      const spread = Math.random() * 5;
      if (spread > 2) {
        console.log(`🎯 OPORTUNIDADE DETECTADA - ${new Date().toLocaleTimeString()}`);
        console.log(`Par: ${symbol}`);
        console.log(`Spread: ${spread.toFixed(4)}%`);
        
        // Preparar dados para WebSocket
        const opportunityData = {
          type: 'opportunity',
          symbol: symbol,
          spread: spread,
          spotPrice: 50000 + Math.random() * 1000,
          futuresPrice: 50000 + Math.random() * 1000,
          timestamp: new Date().toISOString(),
          exchangeBuy: 'gateio',
          exchangeSell: 'mexc',
          direction: 'spot-to-future'
        };
        
        // Enviar via WebSocket
        broadcastToClients(opportunityData);
        
        // Salvar no banco se disponível
        if (prisma) {
          try {
            await prisma.spreadHistory.create({
              data: {
                symbol: symbol,
                spread: spread,
                spotPrice: opportunityData.spotPrice,
                futuresPrice: opportunityData.futuresPrice,
                timestamp: new Date(),
                exchangeBuy: 'gateio',
                exchangeSell: 'mexc',
                direction: 'spot-to-future'
              }
            });
            console.log(`[Worker] Dados salvos para ${symbol}`);
          } catch (dbError) {
            console.error(`[Worker] Erro ao salvar:`, dbError);
          }
        }
      }
    }
    
    // Enviar heartbeat para clientes
    broadcastToClients({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      message: 'Worker ativo'
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