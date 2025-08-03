const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMonitorStatus() {
  try {
    console.log('=== TESTE DE STATUS DO MONITOR ===');
    console.log(`Data/Hora atual: ${new Date().toISOString()}`);
    
    // Verifica a última entrada na tabela SpreadHistory
    const lastEntry = await prisma.spreadHistory.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    if (lastEntry) {
      console.log('\n=== ÚLTIMA ENTRADA NO BANCO ===');
      console.log(`ID: ${lastEntry.id}`);
      console.log(`Symbol: ${lastEntry.symbol}`);
      console.log(`Exchange Buy: ${lastEntry.exchangeBuy}`);
      console.log(`Exchange Sell: ${lastEntry.exchangeSell}`);
      console.log(`Direction: ${lastEntry.direction}`);
      console.log(`Spread: ${lastEntry.spread}`);
      console.log(`Spot Price: ${lastEntry.spotPrice}`);
      console.log(`Futures Price: ${lastEntry.futuresPrice}`);
      console.log(`Timestamp: ${lastEntry.timestamp}`);
      
      const timeDiff = Date.now() - new Date(lastEntry.timestamp).getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));
      console.log(`\nTempo desde a última entrada: ${minutesAgo} minutos`);
      
      if (minutesAgo > 10) {
        console.log('⚠️  ATENÇÃO: Última entrada tem mais de 10 minutos!');
      }
    } else {
      console.log('\n❌ Nenhuma entrada encontrada na tabela SpreadHistory');
    }
    
    // Verifica entradas das últimas 24 horas
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const entries24h = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          gte: last24h
        }
      }
    });
    
    console.log(`\n=== ESTATÍSTICAS ÚLTIMAS 24H ===`);
    console.log(`Total de entradas: ${entries24h}`);
    
    if (entries24h === 0) {
      console.log('❌ Nenhuma entrada nas últimas 24 horas!');
    } else if (entries24h < 10) {
      console.log('⚠️  Poucas entradas nas últimas 24 horas');
    } else {
      console.log('✅ Monitor parece estar funcionando');
    }
    
    // Verifica entradas com preços zerados
    const zeroPriceEntries = await prisma.spreadHistory.count({
      where: {
        OR: [
          { spotPrice: 0 },
          { futuresPrice: 0 }
        ],
        timestamp: {
          gte: last24h
        }
      }
    });
    
    console.log(`\n=== PREÇOS ZERADOS (ÚLTIMAS 24H) ===`);
    console.log(`Entradas com preços zerados: ${zeroPriceEntries}`);
    
    if (zeroPriceEntries > 0) {
      console.log('⚠️  Existem entradas com preços zerados');
      
      // Mostra algumas entradas com preços zerados
      const zeroEntries = await prisma.spreadHistory.findMany({
        where: {
          OR: [
            { spotPrice: 0 },
            { futuresPrice: 0 }
          ],
          timestamp: {
            gte: last24h
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 5
      });
      
      console.log('\nExemplos de entradas com preços zerados:');
      zeroEntries.forEach(entry => {
        console.log(`- ${entry.symbol}: Spot=${entry.spotPrice}, Futures=${entry.futuresPrice}, Spread=${entry.spread}, Time=${entry.timestamp}`);
      });
    }
    
    // Verifica entradas com preços válidos
    const validPriceEntries = await prisma.spreadHistory.count({
      where: {
        AND: [
          { spotPrice: { gt: 0 } },
          { futuresPrice: { gt: 0 } }
        ],
        timestamp: {
          gte: last24h
        }
      }
    });
    
    console.log(`\n=== PREÇOS VÁLIDOS (ÚLTIMAS 24H) ===`);
    console.log(`Entradas com preços válidos: ${validPriceEntries}`);
    
    if (validPriceEntries > 0) {
      console.log('✅ Existem entradas com preços válidos');
      
      // Mostra algumas entradas com preços válidos
      const validEntries = await prisma.spreadHistory.findMany({
        where: {
          AND: [
            { spotPrice: { gt: 0 } },
            { futuresPrice: { gt: 0 } }
          ],
          timestamp: {
            gte: last24h
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 5
      });
      
      console.log('\nExemplos de entradas com preços válidos:');
      validEntries.forEach(entry => {
        console.log(`- ${entry.symbol}: Spot=${entry.spotPrice}, Futures=${entry.futuresPrice}, Spread=${entry.spread}, Time=${entry.timestamp}`);
      });
    }
    
  } catch (error) {
    console.error('Erro ao testar status do monitor:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMonitorStatus(); 