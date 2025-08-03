const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentData() {
  try {
    console.log('🔍 Verificando dados mais recentes no banco...\n');
    
    // Verificar os últimos 10 registros
    const recentData = await prisma.spreadHistory.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });
    
    console.log(`📊 Últimos ${recentData.length} registros encontrados:\n`);
    
    recentData.forEach((record, index) => {
      const timestamp = new Date(record.timestamp).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      });
      
      console.log(`${index + 1}. ${record.symbol}`);
      console.log(`   Spread: ${record.spread.toFixed(4)}%`);
      console.log(`   Spot Price: $${record.spotPrice}`);
      console.log(`   Futures Price: $${record.futuresPrice}`);
      console.log(`   Compra: ${record.exchangeBuy}`);
      console.log(`   Venda: ${record.exchangeSell}`);
      console.log(`   Direção: ${record.direction}`);
      console.log(`   Timestamp: ${timestamp}`);
      console.log('');
    });
    
    // Verificar especificamente DODO_USDT
    const dodoData = await prisma.spreadHistory.findMany({
      where: {
        symbol: 'DODO'
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5
    });
    
    if (dodoData.length > 0) {
      console.log('🎯 Dados específicos do DODO:\n');
      dodoData.forEach((record, index) => {
        const timestamp = new Date(record.timestamp).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });
        
        console.log(`${index + 1}. DODO - ${record.spread.toFixed(4)}%`);
        console.log(`   Spot: $${record.spotPrice}, Futures: $${record.futuresPrice}`);
        console.log(`   Timestamp: ${timestamp}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum dado do DODO encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentData(); 