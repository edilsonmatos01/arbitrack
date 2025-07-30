const { PrismaClient } = require('@prisma/client');

async function testSqlQuery() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testando consulta SQL...');
    
    await prisma.$connect();
    
    const symbols = ['VR_USDT', 'VVAIFU_USDT', 'DODO_USDT', 'GORK_USDT'];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const symbolsList = symbols.map(s => `'${s}'`).join(',');
    
    console.log('📊 Executando consulta SQL...');
    console.log('Símbolos:', symbolsList);
    console.log('Desde:', twentyFourHoursAgo.toISOString());
    
    // Testar a consulta SQL diretamente
    const result = await prisma.$queryRaw`
      SELECT 
        symbol,
        MAX(spread) as sp_max,
        MIN(spread) as sp_min,
        COUNT(*) as crosses
      FROM "SpreadHistory" 
      WHERE symbol IN (${symbolsList})
      AND timestamp >= ${twentyFourHoursAgo}
      GROUP BY symbol
    `;
    
    console.log('✅ Resultado da consulta:');
    console.log(JSON.stringify(result, null, 2));
    
    // Testar com Prisma ORM
    console.log('\n📊 Testando com Prisma ORM...');
    
    for (const symbol of symbols) {
      const stats = await prisma.spreadHistory.groupBy({
        by: ['symbol'],
        where: {
          symbol: symbol,
          timestamp: {
            gte: twentyFourHoursAgo
          }
        },
        _max: {
          spread: true
        },
        _min: {
          spread: true
        },
        _count: {
          id: true
        }
      });
      
      if (stats.length > 0) {
        const stat = stats[0];
        console.log(`${symbol}: Max=${stat._max.spread}%, Min=${stat._min.spread}%, Count=${stat._count.id}`);
      } else {
        console.log(`${symbol}: Nenhum dado encontrado`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSqlQuery(); 