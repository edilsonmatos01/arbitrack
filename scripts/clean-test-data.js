const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🧹 LIMPEZA DE DADOS DE TESTE');
console.log('============================');

async function cleanTestData() {
  try {
    console.log('\n🔍 Verificando dados de teste...');
    
    // 1. Limpar SpreadHistory com dados de teste
    const testSpreads = await prisma.spreadHistory.findMany({
      where: {
        OR: [
          { symbol: { contains: 'TEST' } },
          { symbol: { contains: 'test' } }
        ]
      }
    });
    
    console.log(`📊 Encontrados ${testSpreads.length} registros de teste em SpreadHistory`);
    
    if (testSpreads.length > 0) {
      const deletedSpreads = await prisma.spreadHistory.deleteMany({
        where: {
          OR: [
            { symbol: { contains: 'TEST' } },
            { symbol: { contains: 'test' } }
          ]
        }
      });
      console.log(`✅ Removidos ${deletedSpreads.count} registros de SpreadHistory`);
    }

    // 2. Limpar PriceHistory com dados de teste
    const testPrices = await prisma.priceHistory.findMany({
      where: {
        OR: [
          { symbol: { contains: 'TEST' } },
          { symbol: { contains: 'test' } }
        ]
      }
    });
    
    console.log(`📊 Encontrados ${testPrices.length} registros de teste em PriceHistory`);
    
    if (testPrices.length > 0) {
      const deletedPrices = await prisma.priceHistory.deleteMany({
        where: {
          OR: [
            { symbol: { contains: 'TEST' } },
            { symbol: { contains: 'test' } }
          ]
        }
      });
      console.log(`✅ Removidos ${deletedPrices.count} registros de PriceHistory`);
    }

    // 3. Verificar dados reais restantes
    const realSpreads = await prisma.spreadHistory.count();
    const realPrices = await prisma.priceHistory.count();
    
    console.log('\n📊 DADOS REAIS RESTANTES:');
    console.log('=========================');
    console.log(`SpreadHistory: ${realSpreads} registros reais`);
    console.log(`PriceHistory: ${realPrices} registros reais`);

    // 4. Mostrar alguns símbolos reais
    const realSymbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: { symbol: true }
    });

    const realSymbolsOnly = realSymbols.filter(s => !s.symbol.includes('TEST'));
    
    console.log(`\n🎯 SÍMBOLOS REAIS (${realSymbolsOnly.length}):`);
    realSymbolsOnly.slice(0, 10).forEach(s => {
      console.log(`   - ${s.symbol} (${s._count.symbol} registros)`);
    });

    if (realSymbolsOnly.length > 10) {
      console.log(`   ... e mais ${realSymbolsOnly.length - 10} símbolos`);
    }

    console.log('\n🎉 LIMPEZA CONCLUÍDA!');
    console.log('=====================');
    console.log('✅ Todos os dados de teste foram removidos');
    console.log('✅ Apenas dados reais das exchanges permanecem');
    console.log('✅ Sistema pronto para processar apenas dados reais');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
cleanTestData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  }); 