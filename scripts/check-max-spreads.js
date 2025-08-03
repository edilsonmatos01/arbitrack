const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMaxSpreads() {
  try {
    console.log('🔍 Verificando spreads máximos das últimas 24 horas...\n');
    
    // Buscar todos os símbolos únicos
    const symbols = await prisma.spreadHistory.findMany({
      select: {
        symbol: true
      },
      distinct: ['symbol']
    });
    
    console.log(`📊 Encontrados ${symbols.length} símbolos únicos\n`);
    
    // Para cada símbolo, calcular o spread máximo das últimas 24 horas
    for (const { symbol } of symbols) {
      try {
        // Buscar dados das últimas 24 horas
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const spreadData = await prisma.spreadHistory.findMany({
          where: {
            symbol: symbol,
            timestamp: {
              gte: twentyFourHoursAgo
            }
          },
          select: {
            spread: true,
            timestamp: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        });
        
        if (spreadData.length > 0) {
          const maxSpread = Math.max(...spreadData.map(d => d.spread));
          const minSpread = Math.min(...spreadData.map(d => d.spread));
          const avgSpread = spreadData.reduce((sum, d) => sum + d.spread, 0) / spreadData.length;
          
          console.log(`📈 ${symbol}:`);
          console.log(`   Máximo: ${maxSpread.toFixed(4)}%`);
          console.log(`   Mínimo: ${minSpread.toFixed(4)}%`);
          console.log(`   Média: ${avgSpread.toFixed(4)}%`);
          console.log(`   Registros: ${spreadData.length}`);
          console.log(`   Último: ${spreadData[0].timestamp.toLocaleString('pt-BR')}`);
          console.log('');
        } else {
          console.log(`⚠️ ${symbol}: Nenhum dado nas últimas 24 horas\n`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${symbol}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMaxSpreads(); 