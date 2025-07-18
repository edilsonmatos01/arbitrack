// WORKER PURO - SEM SERVIDOR HTTP, SEM WEBSOCKET, SEM PORTAS
// Este arquivo é um BACKGROUND WORKER para o Render

import { PrismaClient } from '@prisma/client';

// Configurações
const MONITORING_INTERVAL = 60 * 1000; // 1 minuto
let isWorkerRunning = false;
let isShuttingDown = false;
let prisma: PrismaClient | null = null;

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
        
        // Salvar no banco se disponível
        if (prisma) {
          try {
            await prisma.spreadHistory.create({
              data: {
                symbol: symbol,
                spread: spread,
                spotPrice: 50000 + Math.random() * 1000,
                futuresPrice: 50000 + Math.random() * 1000,
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
  } catch (error) {
    console.error('[Worker] Erro no monitoramento:', error);
  } finally {
    isWorkerRunning = false;
  }
}

// Função principal do worker
async function startWorker(): Promise<void> {
  console.log('[Worker] Iniciando worker em segundo plano...');
  
  // Inicializa o banco
  await initializePrisma();
  
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