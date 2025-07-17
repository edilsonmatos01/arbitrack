const { PrismaClient } = require('@prisma/client');

console.log('🚀 INICIANDO WORKER SIMPLES');
console.log('===========================\n');

let prisma = null;
let isRunning = false;

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

async function generateTestData() {
  if (!prisma) {
    console.log('⚠️ Prisma não disponível');
    return;
  }

  try {
    console.log('📊 Gerando dados de teste...');
    
    const symbols = ['BTC_USDT', 'ETH_USDT', 'BNB_USDT', 'ADA_USDT', 'SOL_USDT'];
    
    for (const symbol of symbols) {
      // Simular preços realistas
      const basePrice = symbol === 'BTC_USDT' ? 50000 : 
                       symbol === 'ETH_USDT' ? 3000 : 
                       symbol === 'BNB_USDT' ? 400 : 
                       symbol === 'ADA_USDT' ? 0.5 : 100;
      
      const spotPrice = basePrice * (1 + (Math.random() - 0.5) * 0.01); // ±0.5%
      const futuresPrice = spotPrice * (1 + (Math.random() - 0.5) * 0.02); // ±1%
      const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
      
      await prisma.spreadHistory.create({
        data: {
          symbol: symbol,
          exchangeBuy: 'gateio',
          exchangeSell: 'mexc',
          direction: 'spot_to_futures',
          spotPrice: parseFloat(spotPrice.toFixed(6)),
          futuresPrice: parseFloat(futuresPrice.toFixed(6)),
          spread: parseFloat(spread.toFixed(4)),
          timestamp: new Date()
        }
      });
      
      console.log(`✅ ${symbol}: Spot $${spotPrice.toFixed(2)}, Futures $${futuresPrice.toFixed(2)}, Spread ${spread.toFixed(2)}%`);
    }
    
    console.log('🎉 Dados de teste gerados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao gerar dados:', error);
  }
}

async function startWorker() {
  if (isRunning) {
    console.log('⚠️ Worker já está rodando');
    return;
  }

  console.log('🔄 Iniciando worker...');
  isRunning = true;

  try {
    await initializePrisma();
    
    // Gerar dados imediatamente
    await generateTestData();
    
    // Configurar intervalo (a cada 5 minutos)
    const interval = setInterval(async () => {
      if (!isRunning) {
        clearInterval(interval);
        return;
      }
      await generateTestData();
    }, 5 * 60 * 1000); // 5 minutos
    
    console.log('✅ Worker iniciado com sucesso!');
    console.log('⏰ Gerando dados a cada 5 minutos');
    
  } catch (error) {
    console.error('❌ Erro ao iniciar worker:', error);
    isRunning = false;
  }
}

// Tratamento de sinais
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando worker...');
  isRunning = false;
  
  if (prisma) {
    await prisma.$disconnect();
  }
  
  process.exit(0);
});

// Iniciar
startWorker().catch(console.error); 