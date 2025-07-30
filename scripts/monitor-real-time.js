const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');

console.log('🔍 MONITOR EM TEMPO REAL - DADOS REAIS');
console.log('=====================================');
console.log('⏰ Iniciando monitoramento...\n');

const prisma = new PrismaClient();
let ws = null;
let isConnected = false;

// Estatísticas em tempo real
let stats = {
  startTime: new Date(),
  opportunitiesReceived: 0,
  heartbeatsReceived: 0,
  lastOpportunity: null,
  lastHeartbeat: null,
  priceUpdates: {
    gateio: 0,
    mexc: 0
  }
};

function formatTime(date) {
  return date.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    hour12: false 
  });
}

function connectToWorker() {
  console.log('🔌 Conectando ao worker...');
  
  ws = new WebSocket('ws://localhost:10000');
  
  ws.on('open', () => {
    isConnected = true;
    console.log('✅ Conectado ao worker!');
    console.log('📊 Monitorando dados em tempo real...\n');
  });
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'arbitrage') {
        stats.opportunitiesReceived++;
        stats.lastOpportunity = new Date();
        
        console.log(`🎯 OPORTUNIDADE #${stats.opportunitiesReceived} DETECTADA:`);
        console.log(`   Símbolo: ${message.baseSymbol}`);
        console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
        console.log(`   Compra: ${message.buyAt.exchange} ${message.buyAt.marketType} - $${message.buyAt.price}`);
        console.log(`   Venda: ${message.sellAt.exchange} ${message.sellAt.marketType} - $${message.sellAt.price}`);
        console.log(`   Timestamp: ${formatTime(new Date(message.timestamp))}`);
        console.log('');
        
        // Verificar se foi salva no banco
        await checkDatabaseForOpportunity(message);
        
      } else if (message.type === 'heartbeat') {
        stats.heartbeatsReceived++;
        stats.lastHeartbeat = new Date();
        
        console.log(`💓 Heartbeat #${stats.heartbeatsReceived}: ${message.message}`);
        console.log(`   Timestamp: ${formatTime(new Date(message.timestamp))}\n`);
        
      } else {
        console.log('📨 Mensagem recebida:', message);
      }
      
    } catch (error) {
      console.log('❌ Erro ao processar mensagem:', error.message);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ Erro na conexão:', error.message);
    isConnected = false;
  });
  
  ws.on('close', () => {
    console.log('🔌 Conexão fechada');
    isConnected = false;
    
    // Tentar reconectar
    setTimeout(() => {
      if (!isConnected) {
        console.log('🔄 Tentando reconectar...');
        connectToWorker();
      }
    }, 5000);
  });
}

async function checkDatabaseForOpportunity(opportunity) {
  try {
    // Verificar se a oportunidade foi salva no banco
    const savedRecord = await prisma.spreadHistory.findFirst({
      where: {
        symbol: opportunity.baseSymbol,
        spread: opportunity.profitPercentage,
        spotPrice: opportunity.buyAt.price,
        futuresPrice: opportunity.sellAt.price,
        timestamp: {
          gte: new Date(Date.now() - 60000) // Últimos 60 segundos
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    if (savedRecord) {
      console.log(`✅ Oportunidade salva no banco! ID: ${savedRecord.id}`);
    } else {
      console.log(`⚠️  Oportunidade ainda não foi salva no banco`);
    }
  } catch (error) {
    console.log('❌ Erro ao verificar banco:', error.message);
  }
}

async function showDatabaseStats() {
  try {
    // Últimos registros salvos
    const recentRecords = await prisma.spreadHistory.findMany({
      take: 5,
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    if (recentRecords.length > 0) {
      console.log('📊 ÚLTIMOS REGISTROS NO BANCO:');
      recentRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${record.symbol} - ${record.spread.toFixed(4)}%`);
        console.log(`   Spot: $${record.spotPrice}, Futures: $${record.futuresPrice}`);
        console.log(`   Timestamp: ${formatTime(record.timestamp)}`);
        console.log('');
      });
    }
    
    // Estatísticas gerais
    const totalRecords = await prisma.spreadHistory.count();
    const todayRecords = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    
    console.log('📈 ESTATÍSTICAS DO BANCO:');
    console.log(`   Total de registros: ${totalRecords}`);
    console.log(`   Registros hoje: ${todayRecords}`);
    console.log('');
    
  } catch (error) {
    console.log('❌ Erro ao buscar estatísticas do banco:', error.message);
  }
}

function showWorkerStats() {
  const now = new Date();
  const uptime = Math.floor((now - stats.startTime) / 1000);
  
  console.log('📊 ESTATÍSTICAS DO WORKER:');
  console.log(`   Tempo ativo: ${uptime} segundos`);
  console.log(`   Oportunidades recebidas: ${stats.opportunitiesReceived}`);
  console.log(`   Heartbeats recebidos: ${stats.heartbeatsReceived}`);
  
  if (stats.lastOpportunity) {
    const timeSinceLast = Math.floor((now - stats.lastOpportunity) / 1000);
    console.log(`   Última oportunidade: há ${timeSinceLast} segundos`);
  }
  
  if (stats.lastHeartbeat) {
    const timeSinceLast = Math.floor((now - stats.lastHeartbeat) / 1000);
    console.log(`   Último heartbeat: há ${timeSinceLast} segundos`);
  }
  
  console.log(`   Status da conexão: ${isConnected ? '✅ Conectado' : '❌ Desconectado'}`);
  console.log('');
}

// Função principal de monitoramento
async function startMonitoring() {
  console.log('🚀 Iniciando monitoramento em tempo real...\n');
  
  // Conectar ao worker
  connectToWorker();
  
  // Mostrar estatísticas a cada 30 segundos
  setInterval(async () => {
    console.log('='.repeat(50));
    console.log(`📊 RELATÓRIO - ${formatTime(new Date())}`);
    console.log('='.repeat(50));
    
    showWorkerStats();
    await showDatabaseStats();
    
    console.log('⏳ Aguardando próximos dados...\n');
  }, 30000);
  
  // Mostrar estatísticas iniciais após 10 segundos
  setTimeout(async () => {
    console.log('📊 ESTATÍSTICAS INICIAIS:');
    console.log('='.repeat(30));
    showWorkerStats();
    await showDatabaseStats();
    console.log('⏳ Aguardando dados...\n');
  }, 10000);
}

// Tratamento de encerramento
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando monitoramento...');
  if (ws) ws.close();
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

// Iniciar monitoramento
startMonitoring().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 