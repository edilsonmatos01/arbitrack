const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    console.log('Verificando dados das últimas 24h...');
    console.log('De:', start.toISOString());
    console.log('Até:', now.toISOString());
    
    const count = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          gte: start,
          lte: now
        }
      }
    });
    
    console.log('Total de registros:', count);
    
    const latest = await prisma.spreadHistory.findFirst({
      where: {
        timestamp: {
          gte: start
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    if (latest) {
      console.log('Último registro:', latest.timestamp.toISOString());
      console.log('Symbol:', latest.symbol);
      console.log('Spread:', latest.spread);
    } else {
      console.log('Nenhum registro encontrado nas últimas 24h');
    }
    
    // Verificar dados específicos do WHITE_USDT
    const whiteData = await prisma.spreadHistory.findMany({
      where: {
        symbol: 'WHITE_USDT',
        timestamp: {
          gte: start,
          lte: now
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5
    });
    
    console.log('\nÚltimos 5 registros de WHITE_USDT:');
    whiteData.forEach(record => {
      console.log(`${record.timestamp.toISOString()} - Spread: ${record.spread}%`);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 