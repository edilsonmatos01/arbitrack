import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function optimizeDatabase() {
  try {
    console.log('🔧 Iniciando otimização do banco de dados...\n');

    // 1. Verificar tamanho atual
    console.log('📊 Verificando tamanho atual...');
    const totalRecords = await prisma.spreadHistory.count();
    console.log(`   Total de registros: ${totalRecords.toLocaleString()}`);

    // 2. Verificar registros antigos (mais de 7 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oldRecords = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          lt: sevenDaysAgo
        }
      }
    });

    console.log(`   Registros com mais de 7 dias: ${oldRecords.toLocaleString()}`);

    if (oldRecords > 0) {
      console.log(`\n🗑️  Removendo ${oldRecords.toLocaleString()} registros antigos...`);
      
      const deleteResult = await prisma.spreadHistory.deleteMany({
        where: {
          timestamp: {
            lt: sevenDaysAgo
          }
        }
      });

      console.log(`   ✅ Removidos ${deleteResult.count.toLocaleString()} registros`);
    }

    // 3. Verificar registros com preços zerados
    const zeroPriceRecords = await prisma.spreadHistory.count({
      where: {
        OR: [
          { spotPrice: 0 },
          { futuresPrice: 0 }
        ]
      }
    });

    console.log(`\n🔍 Registros com preços zerados: ${zeroPriceRecords.toLocaleString()}`);

    if (zeroPriceRecords > 0) {
      console.log('🗑️  Removendo registros com preços zerados...');
      
      const deleteZeroResult = await prisma.spreadHistory.deleteMany({
        where: {
          OR: [
            { spotPrice: 0 },
            { futuresPrice: 0 }
          ]
        }
      });

      console.log(`   ✅ Removidos ${deleteZeroResult.count.toLocaleString()} registros`);
    }

    // 4. Verificar registros duplicados (mesmo símbolo, mesmo timestamp)
    console.log('\n🔍 Verificando registros duplicados...');
    
    const duplicates = await prisma.$queryRaw`
      SELECT symbol, timestamp, COUNT(*) as count
      FROM "SpreadHistory"
      GROUP BY symbol, timestamp
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `;

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      console.log('   Encontrados registros duplicados:');
      duplicates.forEach((dup: any) => {
        console.log(`     ${dup.symbol}: ${dup.count} registros em ${dup.timestamp}`);
      });

      // Remover duplicados mantendo apenas o mais recente
      console.log('\n🗑️  Removendo duplicados...');
      
      const deleteDuplicatesResult = await prisma.$executeRaw`
        DELETE FROM "SpreadHistory"
        WHERE id NOT IN (
          SELECT MAX(id)
          FROM "SpreadHistory"
          GROUP BY symbol, timestamp
        )
      `;

      console.log(`   ✅ Duplicados removidos`);
    }

    // 5. Estatísticas finais
    const finalCount = await prisma.spreadHistory.count();
    console.log(`\n📊 Estatísticas finais:`);
    console.log(`   Total de registros: ${finalCount.toLocaleString()}`);

    // 6. Verificar símbolos mais ativos
    const topSymbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
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

    console.log(`\n🏆 Top 10 símbolos mais ativos:`);
    topSymbols.forEach((symbol, index) => {
      console.log(`   ${index + 1}. ${symbol.symbol}: ${symbol._count.symbol.toLocaleString()} registros`);
    });

    // 7. Verificar dados recentes (últimas 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRecords = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          gte: twentyFourHoursAgo
        }
      }
    });

    console.log(`\n⏰ Dados das últimas 24h: ${recentRecords.toLocaleString()} registros`);

    // 8. Verificar símbolos sem dados recentes
    const symbolsWithRecentData = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      where: {
        timestamp: {
          gte: twentyFourHoursAgo
        }
      },
      _count: {
        symbol: true
      }
    });

    const allSymbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: {
        symbol: true
      }
    });

    const inactiveSymbols = allSymbols.filter(symbol => 
      !symbolsWithRecentData.some(recent => recent.symbol === symbol.symbol)
    );

    if (inactiveSymbols.length > 0) {
      console.log(`\n⚠️  Símbolos inativos (sem dados nas últimas 24h):`);
      inactiveSymbols.slice(0, 10).forEach(symbol => {
        console.log(`   - ${symbol.symbol}: ${symbol._count.symbol} registros totais`);
      });
      
      if (inactiveSymbols.length > 10) {
        console.log(`   ... e mais ${inactiveSymbols.length - 10} símbolos`);
      }
    }

    console.log('\n✅ Otimização concluída!');

  } catch (error) {
    console.error('❌ Erro durante otimização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabase(); 