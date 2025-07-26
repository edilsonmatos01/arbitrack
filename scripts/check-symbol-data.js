// Script para verificar dados de símbolos específicos no banco
const { PrismaClient } = require('@prisma/client');

async function checkSymbolData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando dados de símbolos no banco...');
    
    // Símbolos que aparecem com N/D na interface
    const symbolsToCheck = ['RBNT_USDT', 'GROK_USDT', 'WHITE_USDT', 'LUCE_USDT', 'VR_USDT'];
    
    // Verificar dados das últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const symbol of symbolsToCheck) {
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
      
      console.log(`   - Registros nas últimas 24h: ${count}`);
      
      if (count > 0) {
        // Buscar estatísticas
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
          _avg: {
            spread: true
          },
          _count: {
            id: true
          }
        });
        
        if (stats.length > 0) {
          const stat = stats[0];
          console.log(`   - Spread máximo: ${stat._max.spread?.toFixed(4)}%`);
          console.log(`   - Spread mínimo: ${stat._min.spread?.toFixed(4)}%`);
          console.log(`   - Spread médio: ${stat._avg.spread?.toFixed(4)}%`);
          console.log(`   - Total de registros: ${stat._count.id}`);
        }
        
        // Buscar alguns registros recentes
        const recentRecords = await prisma.spreadHistory.findMany({
          where: {
            symbol: symbol,
            timestamp: {
              gte: twentyFourHoursAgo
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 3
        });
        
        console.log(`   - Últimos 3 registros:`);
        recentRecords.forEach((record, index) => {
          console.log(`     ${index + 1}. ${record.timestamp.toISOString()} - Spread: ${record.spread.toFixed(4)}%`);
        });
      } else {
        console.log(`   - ❌ Nenhum registro encontrado nas últimas 24h`);
        
        // Verificar se há registros mais antigos
        const oldCount = await prisma.spreadHistory.count({
          where: {
            symbol: symbol
          }
        });
        
        if (oldCount > 0) {
          console.log(`   - ⚠️  Encontrados ${oldCount} registros mais antigos`);
          
          // Buscar registro mais recente
          const latestRecord = await prisma.spreadHistory.findFirst({
            where: {
              symbol: symbol
            },
            orderBy: {
              timestamp: 'desc'
            }
          });
          
          if (latestRecord) {
            const hoursAgo = Math.round((Date.now() - latestRecord.timestamp.getTime()) / (1000 * 60 * 60));
            console.log(`   - Último registro: ${hoursAgo} horas atrás - Spread: ${latestRecord.spread.toFixed(4)}%`);
          }
        } else {
          console.log(`   - ❌ Nenhum registro encontrado para este símbolo`);
        }
      }
    }
    
    // Verificar total de registros no banco
    console.log('\n📈 Estatísticas Gerais do Banco:');
    const totalRecords = await prisma.spreadHistory.count();
    console.log(`   - Total de registros: ${totalRecords}`);
    
    const uniqueSymbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: {
        id: true
      }
    });
    
    console.log(`   - Símbolos únicos: ${uniqueSymbols.length}`);
    
    // Top 10 símbolos com mais registros
    const topSymbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });
    
    console.log('\n🏆 Top 10 Símbolos com Mais Registros:');
    topSymbols.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.symbol}: ${item._count.id} registros`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSymbolData(); 