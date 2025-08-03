import { PrismaClient } from '@prisma/client';

// Configuração otimizada do Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

async function diagnoseDatabase() {
  try {
    console.log('🔍 Diagnosticando banco de dados...\n');

    // 1. Teste básico de conectividade
    console.log('📡 Teste de conectividade...');
    const startTime = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      const responseTime = Date.now() - startTime;
      console.log(`   ✅ Conectividade OK (${responseTime}ms)`);
    } catch (error) {
      console.log(`   ❌ Erro de conectividade:`, error);
      return;
    }

    // 2. Verificar versão do PostgreSQL
    try {
      const version = await prisma.$queryRaw`SELECT version()`;
      const versionResult = version as any[];
      console.log(`   📊 Versão: ${versionResult[0]?.version || 'N/A'}`);
    } catch (error) {
      console.log(`   ⚠️  Não foi possível obter versão:`, error);
    }

    // 3. Verificar estatísticas da tabela
    console.log('\n📊 Estatísticas da tabela SpreadHistory...');
    
    const totalRecords = await prisma.spreadHistory.count();
    console.log(`   Total de registros: ${totalRecords.toLocaleString()}`);

    const recentRecords = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    console.log(`   Registros nas últimas 24h: ${recentRecords.toLocaleString()}`);

    // 4. Verificar símbolos mais ativos
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
      take: 5
    });

    console.log('\n🏆 Top 5 símbolos mais ativos:');
    topSymbols.forEach((symbol, index) => {
      console.log(`   ${index + 1}. ${symbol.symbol}: ${symbol._count.symbol.toLocaleString()} registros`);
    });

    // 5. Teste de performance - query simples
    console.log('\n⚡ Teste de performance...');
    
    const perfStart = Date.now();
    await prisma.spreadHistory.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // última hora
        }
      },
      take: 1000
    });
    const perfTime = Date.now() - perfStart;
    console.log(`   Query simples: ${perfTime}ms`);

    // 6. Teste de performance - agregação
    const aggStart = Date.now();
    await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      _count: {
        symbol: true
      }
    });
    const aggTime = Date.now() - aggStart;
    console.log(`   Query de agregação: ${aggTime}ms`);

    // 7. Verificar registros com problemas
    console.log('\n🔍 Verificando registros problemáticos...');
    
    const zeroPriceCount = await prisma.spreadHistory.count({
      where: {
        OR: [
          { spotPrice: 0 },
          { futuresPrice: 0 }
        ]
      }
    });
    console.log(`   Registros com preços zerados: ${zeroPriceCount.toLocaleString()}`);

    // Verificação de preços nulos removida devido a limitações do Prisma
    console.log(`   Registros com preços nulos: N/A (verificação não disponível)`);

    // 8. Verificar duplicatas
    const duplicates = await prisma.$queryRaw`
      SELECT COUNT(*) as duplicate_count
      FROM (
        SELECT symbol, timestamp, COUNT(*)
        FROM "SpreadHistory"
        GROUP BY symbol, timestamp
        HAVING COUNT(*) > 1
      ) as dupes
    `;
    
    const duplicatesResult = duplicates as any[];
    const duplicateCount = duplicatesResult[0]?.duplicate_count || 0;
    console.log(`   Registros duplicados: ${duplicateCount.toLocaleString()}`);

    // 9. Recomendações
    console.log('\n💡 Recomendações:');
    
    if (totalRecords > 1000000) {
      console.log('   ⚠️  Muitos registros - considere limpeza de dados antigos');
    }
    
    if (zeroPriceCount > 0) {
      console.log('   ⚠️  Registros com preços zerados - limpeza recomendada');
    }
    
    if (duplicateCount > 0) {
      console.log('   ⚠️  Registros duplicados - limpeza recomendada');
    }
    
    if (perfTime > 1000) {
      console.log('   ⚠️  Performance lenta - considere otimizar queries');
    }
    
    if (aggTime > 2000) {
      console.log('   ⚠️  Agregações lentas - considere índices');
    }

    console.log('\n✅ Diagnóstico concluído!');

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseDatabase(); 