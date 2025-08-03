const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWorkerLogs() {
  try {
    console.log('🔍 Verificando logs do worker...');
    
    // Verificar registros das últimas horas
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    console.log('📊 Verificando registros da última hora...');
    const lastHour = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          gte: oneHourAgo
        }
      }
    });
    
    console.log('📊 Verificando registros das últimas 2 horas...');
    const lastTwoHours = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          gte: twoHoursAgo
        }
      }
    });
    
    console.log(`✅ Última hora: ${lastHour} registros`);
    console.log(`✅ Últimas 2 horas: ${lastTwoHours} registros`);
    
    // Verificar registros mais recentes
    const recentRecords = await prisma.spreadHistory.findMany({
      where: {
        timestamp: {
          gte: oneHourAgo
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    
    console.log('\n📊 Registros mais recentes:');
    if (recentRecords.length === 0) {
      console.log('⚠️  Nenhum registro nas últimas horas');
    } else {
      recentRecords.forEach(record => {
        console.log(`  - ${record.symbol}: ${record.spread.toFixed(4)}% (${record.timestamp.toLocaleString()})`);
      });
    }
    
    // Verificar se há registros com preços zero
    const zeroPriceRecords = await prisma.spreadHistory.findMany({
      where: {
        OR: [
          { spotPrice: 0 },
          { futuresPrice: 0 }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    console.log('\n🔍 Registros com preços zero:');
    if (zeroPriceRecords.length === 0) {
      console.log('✅ Nenhum registro com preços zero');
    } else {
      zeroPriceRecords.forEach(record => {
        console.log(`  - ${record.symbol}: Spot=${record.spotPrice}, Futures=${record.futuresPrice} (${record.timestamp.toLocaleString()})`);
      });
    }
    
    // Verificar símbolos mais ativos
    const activeSymbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      where: {
        timestamp: {
          gte: twoHoursAgo
        }
      },
      _count: {
        symbol: true
      },
      orderBy: {
        _count: {
          symbol: 'desc'
        }
      },
      take: 10
    });
    
    console.log('\n📊 Símbolos mais ativos (últimas 2h):');
    activeSymbols.forEach(symbol => {
      console.log(`  - ${symbol.symbol}: ${symbol._count.symbol} registros`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkerLogs(); 