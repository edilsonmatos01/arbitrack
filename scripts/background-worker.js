const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Interfaces
class MarketPrice {
  constructor(symbol, bestAsk, bestBid) {
    this.symbol = symbol;
    this.bestAsk = bestAsk;
    this.bestBid = bestBid;
  }
}

class TradableSymbol {
  constructor(baseSymbol, gateioSymbol, mexcSymbol, gateioFuturesSymbol, mexcFuturesSymbol) {
    this.baseSymbol = baseSymbol;
    this.gateioSymbol = gateioSymbol;
    this.mexcSymbol = mexcSymbol;
    this.gateioFuturesSymbol = gateioFuturesSymbol;
    this.mexcFuturesSymbol = mexcFuturesSymbol;
  }
}

// Configurações (otimizado para economia)
const MONITORING_INTERVAL = 30 * 60 * 1000; // 30 minutos
const RECONNECT_INTERVAL = 5000; // 5 segundos
const DB_RETRY_INTERVAL = 30000; // 30 segundos
const SUBSCRIPTION_INTERVAL = 5 * 60 * 1000; // 5 minutos
let isWorkerRunning = false;
let isShuttingDown = false;
let prisma = null;

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
    op: "sub",
    symbol: symbol,
    channel: "spot.ticker"
  }),
  'Gate.io Futures': (symbol) => ({
    id: Date.now(),
    time: Date.now(),
    channel: "futures.tickers",
    event: "subscribe",
    payload: [symbol]
  }),
  'MEXC Futures': (symbol) => ({
    op: "sub",
    symbol: symbol,
    channel: "contract.ticker"
  })
};

// Função para obter pares negociáveis
async function getTradablePairs() {
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'tradableSymbols.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return data.map(item => new TradableSymbol(
        item.baseSymbol,
        item.gateioSymbol,
        item.mexcSymbol,
        item.gateioFuturesSymbol,
        item.mexcFuturesSymbol
      ));
    }
  } catch (error) {
    console.error('Erro ao carregar pares negociáveis:', error);
  }
  
  // Fallback para pares básicos
  return [
    new TradableSymbol('BTC', 'BTC_USDT', 'BTC_USDT', 'BTC_USDT', 'BTC_USDT'),
    new TradableSymbol('ETH', 'ETH_USDT', 'ETH_USDT', 'ETH_USDT', 'ETH_USDT'),
    new TradableSymbol('BNB', 'BNB_USDT', 'BNB_USDT', 'BNB_USDT', 'BNB_USDT')
  ];
}

// Função para inicializar Prisma
async function initializePrisma() {
  try {
    if (!prisma) {
      prisma = new PrismaClient();
      await prisma.$connect();
      console.log('✅ Prisma conectado com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro ao conectar Prisma:', error);
    prisma = null;
  }
}

// Função para processar mensagens WebSocket
function processWebSocketMessage(exchange, data) {
  try {
    const message = JSON.parse(data);
    console.log(`[${exchange}] Mensagem recebida:`, message);
    
    // Processar dados específicos de cada exchange
    if (exchange === 'Gate.io Spot' && message.channel === 'spot.tickers') {
      // Processar dados do Gate.io Spot
    } else if (exchange === 'MEXC Spot' && message.c) {
      // Processar dados do MEXC Spot
    }
  } catch (error) {
    console.error(`[${exchange}] Erro ao processar mensagem:`, error);
  }
}

// Função para monitorar e armazenar dados
async function monitorAndStore() {
  if (!prisma) {
    console.log('⚠️ Prisma não disponível, tentando reconectar...');
    await initializePrisma();
    return;
  }

  try {
    console.log('📊 Iniciando monitoramento...');
    
    // Simular dados de teste para desenvolvimento
    const testSymbols = ['BTC_USDT', 'ETH_USDT', 'BNB_USDT'];
    
    for (const symbol of testSymbols) {
      const spotPrice = Math.random() * 50000 + 20000; // Preço aleatório
      const futuresPrice = spotPrice * (1 + (Math.random() - 0.5) * 0.02); // Variação de ±1%
      const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
      
      await prisma.spreadHistory.create({
        data: {
          symbol: symbol,
          spotPrice: spotPrice,
          futuresPrice: futuresPrice,
          spread: spread,
          timestamp: new Date()
        }
      });
      
      console.log(`✅ Dados salvos para ${symbol}: Spot $${spotPrice.toFixed(2)}, Futures $${futuresPrice.toFixed(2)}, Spread ${spread.toFixed(2)}%`);
    }
    
  } catch (error) {
    console.error('❌ Erro no monitoramento:', error);
  }
}

// Função principal do worker
async function startWorker() {
  if (isWorkerRunning) {
    console.log('⚠️ Worker já está rodando');
    return;
  }

  console.log('🚀 Iniciando worker de coleta de dados...');
  isWorkerRunning = true;

  try {
    // Inicializar Prisma
    await initializePrisma();
    
    // Iniciar monitoramento
    console.log('📊 Iniciando monitoramento de dados...');
    
    // Executar monitoramento imediatamente
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
    console.log(`⏰ Monitoramento configurado para ${MONITORING_INTERVAL / 60000} minutos`);
    
  } catch (error) {
    console.error('❌ Erro ao iniciar worker:', error);
    isWorkerRunning = false;
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