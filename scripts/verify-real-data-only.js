const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔍 VERIFICAÇÃO - APENAS DADOS REAIS');
console.log('===================================');

async function verifyRealDataOnly() {
  try {
    console.log('\n📊 Verificando banco de dados...\n');
    
    // 1. Verificar SpreadHistory
    const totalSpreads = await prisma.spreadHistory.count();
    const testSpreads = await prisma.spreadHistory.count({
      where: {
        OR: [
          { symbol: { contains: 'TEST' } },
          { symbol: { contains: 'test' } }
        ]
      }
    });
    
    const realSpreads = totalSpreads - testSpreads;
    
    console.log('📈 SPREAD HISTORY:');
    console.log(`   Total: ${totalSpreads}`);
    console.log(`   Reais: ${realSpreads}`);
    console.log(`   Teste: ${testSpreads}`);
    
    // 2. Verificar PriceHistory
    const totalPrices = await prisma.priceHistory.count();
    const testPrices = await prisma.priceHistory.count({
      where: {
        OR: [
          { symbol: { contains: 'TEST' } },
          { symbol: { contains: 'test' } }
        ]
      }
    });
    
    const realPrices = totalPrices - testPrices;
    
    console.log('\n💰 PRICE HISTORY:');
    console.log(`   Total: ${totalPrices}`);
    console.log(`   Reais: ${realPrices}`);
    console.log(`   Teste: ${testPrices}`);
    
    // 3. Verificar símbolos únicos reais
    const allSymbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: { symbol: true }
    });
    
    const realSymbols = allSymbols.filter(s => !s.symbol.includes('TEST'));
    const testSymbols = allSymbols.filter(s => s.symbol.includes('TEST'));
    
    console.log('\n🎯 SÍMBOLOS:');
    console.log(`   Reais: ${realSymbols.length}`);
    console.log(`   Teste: ${testSymbols.length}`);
    
    if (realSymbols.length > 0) {
      console.log('\n📋 SÍMBOLOS REAIS ENCONTRADOS:');
      realSymbols.slice(0, 15).forEach(s => {
        console.log(`   - ${s.symbol} (${s._count.symbol} registros)`);
      });
      
      if (realSymbols.length > 15) {
        console.log(`   ... e mais ${realSymbols.length - 15} símbolos`);
      }
    }
    
    if (testSymbols.length > 0) {
      console.log('\n⚠️  SÍMBOLOS DE TESTE ENCONTRADOS:');
      testSymbols.forEach(s => {
        console.log(`   - ${s.symbol} (${s._count.symbol} registros)`);
      });
    }
    
    // 4. Verificar dados recentes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRealData = await prisma.spreadHistory.count({
      where: {
        AND: [
          { timestamp: { gte: oneHourAgo } },
          {
            NOT: {
              symbol: { contains: 'TEST' }
            }
          }
        ]
      }
    });
    
    console.log(`\n⏰ Dados reais da última hora: ${recentRealData} registros`);
    
    // 5. Conclusão
    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA:');
    console.log('=========================');
    
    if (testSpreads === 0 && testPrices === 0) {
      console.log('✅ PERFEITO: APENAS DADOS REAIS!');
      console.log('   - Nenhum dado de teste encontrado');
      console.log('   - Sistema processando apenas dados reais das exchanges');
    } else {
      console.log('⚠️  ATENÇÃO: Ainda há dados de teste!');
      console.log('   - Execute o script de limpeza novamente');
    }
    
    if (recentRealData > 0) {
      console.log('✅ Dados reais sendo atualizados em tempo real');
    } else {
      console.log('⚠️  Nenhum dado real recente - verificar se o worker está rodando');
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
verifyRealDataOnly()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  }); 