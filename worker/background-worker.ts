import { PrismaClient } from '@prisma/client';
import WebSocket from 'ws';
import * as https from 'https';
import { MONITORED_PAIRS } from '../lib/predefined-pairs';

// Interfaces
interface MarketPrice {
  symbol: string;
  bestAsk: number;
  bestBid: number;
}

interface TradableSymbol {
  baseSymbol: string;
  gateioSymbol: string;
  mexcSymbol: string;
  gateioFuturesSymbol: string;
  mexcFuturesSymbol: string;
}

interface WebSocketMessage {
  time?: number;
  channel?: string;
  event?: string;
  method?: string;
  params?: string[];
  param?: {
    symbol: string;
  };
  payload?: string[];
}

// Configurações simplificadas
const MONITORING_INTERVAL = 60 * 1000; // 1 minuto (simplificado)
const RECONNECT_INTERVAL = 10000; // 10 segundos
const DB_RETRY_INTERVAL = 30000; // 30 segundos
let isWorkerRunning = false;
let isShuttingDown = false;
let prisma: PrismaClient | null = null;

// Configurações WebSocket
const GATEIO_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_WS_URL = 'wss://wbs.mexc.com/ws';

// Mensagens de subscrição simplificadas
const SUBSCRIPTION_MESSAGES = {
  'Gate.io Spot': (symbol: string) => ({
    id: Date.now(),
    time: Date.now(),
    channel: "spot.tickers",
    event: "subscribe",
    payload: [symbol]
  }),
  'MEXC Spot': (symbol: string) => ({
    op: "sub",
    symbol: symbol,
    channel: "spot.ticker"
  })
};

// Função para criar conexão WebSocket simplificada
async function createWebSocket(url: string, name: string): Promise<WebSocket> {
  console.log(`[${name}] Tentando conectar em: ${url}`);
  
  const ws = new WebSocket(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    handshakeTimeout: 10000
  });

  ws.on('open', () => {
    console.log(`[${name}] Conexão WebSocket estabelecida`);
    
    // Subscrever apenas aos símbolos principais
    const mainSymbols = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];
    for (const symbol of mainSymbols) {
      try {
        const getMessage = SUBSCRIPTION_MESSAGES[name as keyof typeof SUBSCRIPTION_MESSAGES];
        if (getMessage) {
          const message = getMessage(symbol);
          console.log(`[${name}] Enviando subscrição para ${symbol}`);
          ws.send(JSON.stringify(message));
        }
      } catch (error) {
        console.error(`[${name}] Erro ao subscrever ${symbol}:`, error);
      }
    }
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[${name}] Dados recebidos para ${message.symbol || 'unknown'}:`, {
        ask: message.ask || message.bestAsk,
        bid: message.bid || message.bestBid,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[${name}] Erro ao processar mensagem:`, error);
    }
  });

  ws.on('error', (error) => {
    console.error(`[${name}] Erro WebSocket:`, error);
  });

  ws.on('close', () => {
    console.log(`[${name}] Conexão WebSocket fechada`);
    if (!isShuttingDown) {
      setTimeout(() => {
        console.log(`[${name}] Tentando reconectar...`);
        createWebSocket(url, name);
      }, RECONNECT_INTERVAL);
    }
  });

  return ws;
}

// Inicializa as conexões WebSocket
let gateioWs: WebSocket;
let mexcWs: WebSocket;

// Função para inicializar as conexões WebSocket
async function initializeWebSockets(): Promise<void> {
  try {
    console.log('[Worker] Inicializando conexões WebSocket...');
    gateioWs = await createWebSocket(GATEIO_WS_URL, 'Gate.io Spot');
    mexcWs = await createWebSocket(MEXC_WS_URL, 'MEXC Spot');
    console.log('[Worker] Conexões WebSocket inicializadas com sucesso');
  } catch (error) {
    console.error('[Worker] Erro ao inicializar conexões WebSocket:', error);
  }
}

// Função para inicializar o Prisma com retry
async function initializePrisma(): Promise<void> {
  console.log('[Worker] Inicializando conexão com banco de dados...');
  let retryCount = 0;
  const maxRetries = 5;
  
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
      console.error(`[Worker] Erro ao conectar com o banco de dados (tentativa ${retryCount}/${maxRetries}):`, error);
      if (retryCount < maxRetries) {
        console.log(`[Worker] Tentando reconectar ao banco de dados em ${DB_RETRY_INTERVAL/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, DB_RETRY_INTERVAL));
      } else {
        console.log('[Worker] Máximo de tentativas atingido, continuando sem banco de dados');
      }
    }
  }
}

// Função para obter pares negociáveis
async function getTradablePairs(): Promise<TradableSymbol[]> {
  // Retorna apenas os pares principais para simplificar
  const mainPairs = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];
  return mainPairs.map((pair) => ({
    baseSymbol: pair.replace('_USDT', ''),
    gateioSymbol: pair,
    mexcSymbol: pair,
    gateioFuturesSymbol: pair,
    mexcFuturesSymbol: pair
  }));
}

// Função principal de monitoramento simplificada
async function monitorAndStore(): Promise<void> {
  if (isWorkerRunning) {
    console.log('[Worker] Monitoramento já está em execução');
    return;
  }

  try {
    isWorkerRunning = true;
    console.log(`[Worker ${new Date().toISOString()}] Monitoramento ativo`);
    
    // Simular detecção de oportunidades
    const symbols = await getTradablePairs();
    for (const symbol of symbols) {
      if (isShuttingDown) break;
      
      // Simular spread aleatório para teste
      const spread = Math.random() * 5; // 0-5%
      if (spread > 2) { // Se spread > 2%, é uma oportunidade
        console.log(`🎯 OPORTUNIDADE DETECTADA - ${new Date().toLocaleTimeString()}`);
        console.log(`Par: ${symbol.baseSymbol}_USDT`);
        console.log(`Spread: ${spread.toFixed(4)}%`);
        
        // Salvar no banco se disponível
        if (prisma) {
          try {
            await prisma.spreadHistory.create({
              data: {
                symbol: symbol.baseSymbol + '_USDT',
                spread: spread,
                spotPrice: 50000 + Math.random() * 1000, // Preço simulado
                futuresPrice: 50000 + Math.random() * 1000, // Preço simulado
                timestamp: new Date(),
                exchangeBuy: 'gateio',
                exchangeSell: 'mexc',
                direction: 'spot-to-future'
              }
            });
            console.log(`[Worker] Dados salvos no banco para ${symbol.baseSymbol}_USDT`);
          } catch (dbError) {
            console.error(`[Worker] Erro ao salvar no banco:`, dbError);
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

// Função principal que mantém o worker rodando
async function startWorker(): Promise<void> {
  console.log('[Worker] Iniciando worker em segundo plano...');
  
  // Inicializa o banco de dados
  await initializePrisma();
  
  // Inicializa as conexões WebSocket
  await initializeWebSockets();
  
  console.log('[Worker] Worker iniciado com sucesso!');
  
  // Loop principal simplificado
  while (!isShuttingDown) {
    try {
      await monitorAndStore();
      await new Promise(resolve => setTimeout(resolve, MONITORING_INTERVAL));
    } catch (error) {
      console.error('[Worker] Erro no loop principal:', error);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 segundos antes de tentar novamente
    }
  }
}

// Tratamento de encerramento gracioso
process.on('SIGTERM', async () => {
  console.log('[Worker] Recebido sinal SIGTERM, encerrando graciosamente...');
  isShuttingDown = true;
  
  // Fecha as conexões WebSocket
  if (gateioWs) gateioWs.close();
  if (mexcWs) mexcWs.close();
  
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] Recebido sinal SIGINT, encerrando graciosamente...');
  isShuttingDown = true;
  
  // Fecha as conexões WebSocket
  if (gateioWs) gateioWs.close();
  if (mexcWs) mexcWs.close();
  
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

// Inicia o worker
console.log('[Worker] Iniciando worker...');
startWorker().catch(error => {
  console.error('[Worker] Erro fatal:', error);
  process.exit(1);
}); 