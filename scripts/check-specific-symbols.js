const { PrismaClient } = require('@prisma/client');

async function checkSpecificSymbols() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando símbolos específicos da tabela...');
    
    await prisma.$connect();
    
    const symbols = ['VR_USDT', 'VVAIFU_USDT', 'DODO_USDT', 'GORK_USDT'];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const symbol of symbols) {
      console.log(`\n📊 Verificando ${symbol}:`);
      
      // Contar registros
      const count = await prisma.spreadHistory.count({
        where: {
          symbol: symbol,
          timestamp: {
            gte: twentyFourHoursAgo
          }
        }
      });
      
      console.log(`   Total registros (24h): ${count}`);
      
      if (count > 0) {
        // Spread máximo
        const maxSpread = await prisma.spreadHistory.findFirst({
          where: {
            symbol: symbol,
            timestamp: {
              gte: twentyFourHoursAgo
            }
          },
          orderBy: {
            spread: 'desc'
          },
          select: {
            spread: true,
            timestamp: true
          }
        });
        
        console.log(`   Spread máximo: ${maxSpread?.spread}% (${maxSpread?.timestamp.toISOString()})`);
        
        // Último registro
        const lastRecord = await prisma.spreadHistory.findFirst({
          where: {
            symbol: symbol
          },
          orderBy: {
            timestamp: 'desc'
          },
          select: {
            spread: true,
            timestamp: true
          }
        });
        
        console.log(`   Último registro: ${lastRecord?.spread}% (${lastRecord?.timestamp.toISOString()})`);
      } else {
        console.log(`   ❌ Nenhum registro encontrado`);
      }
    }
    
    // Verificar alguns símbolos que devem ter dados
    console.log('\n📊 Verificando símbolos comuns:');
    const commonSymbols = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];
    
    for (const symbol of commonSymbols) {
      const count = await prisma.spreadHistory.count({
        where: {
          symbol: symbol,
          timestamp: {
            gte: twentyFourHoursAgo
          }
        }
      });
      
      console.log(`   ${symbol}: ${count} registros`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificSymbols(); 