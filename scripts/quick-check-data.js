const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔍 VERIFICAÇÃO RÁPIDA - DADOS REAIS?');
console.log('=====================================');

async function quickCheck() {
  try {
    // Verificar últimos registros
    const recentSpreads = await prisma.spreadHistory.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    });

    console.log('\n📊 ÚLTIMOS 5 REGISTROS:');
    console.log('========================');
    
    for (const record of recentSpreads) {
      const isTest = record.symbol.includes('TEST');
      const isRecent = (Date.now() - record.timestamp.getTime()) < 60 * 60 * 1000; // 1h
      
      console.log(`\n🎯 ${record.symbol} ${isTest ? '(TESTE)' : '(REAL)'}`);
      console.log(`   Spread: ${record.spread.toFixed(4)}%`);
      console.log(`   Compra: ${record.exchangeBuy} @ $${record.spotPrice}`);
      console.log(`   Venda: ${record.exchangeSell} @ $${record.futuresPrice}`);
      console.log(`   Timestamp: ${record.timestamp.toLocaleString()}`);
      console.log(`   ✅ Recente: ${isRecent ? 'SIM' : 'NÃO'}`);
    }

    // Verificar símbolos únicos
    const uniqueSymbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: { symbol: true }
    });

    const realSymbols = uniqueSymbols.filter(s => !s.symbol.includes('TEST'));
    const testSymbols = uniqueSymbols.filter(s => s.symbol.includes('TEST'));

    console.log('\n📋 RESUMO:');
    console.log('==========');
    console.log(`Total de símbolos: ${uniqueSymbols.length}`);
    console.log(`Símbolos reais: ${realSymbols.length}`);
    console.log(`Símbolos de teste: ${testSymbols.length}`);

    if (realSymbols.length > 0) {
      console.log('\n🎯 SÍMBOLOS REAIS ENCONTRADOS:');
      realSymbols.slice(0, 10).forEach(s => {
        console.log(`   - ${s.symbol} (${s._count.symbol} registros)`);
      });
    }

    // Verificar dados recentes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.spreadHistory.count({
      where: { timestamp: { gte: oneHourAgo } }
    });

    console.log(`\n⏰ Dados da última hora: ${recentCount} registros`);

    // Conclusão
    console.log('\n🎉 CONCLUSÃO:');
    console.log('==============');
    
    if (realSymbols.length > 0 && recentCount > 0) {
      console.log('✅ OS DADOS SÃO REAIS!');
      console.log('   - Símbolos reais de criptomoedas encontrados');
      console.log('   - Dados sendo atualizados recentemente');
    } else if (realSymbols.length > 0) {
      console.log('⚠️  DADOS REAIS MAS ANTIGOS');
      console.log('   - Símbolos reais encontrados');
      console.log('   - Mas não há dados recentes (última hora)');
    } else {
      console.log('❌ APENAS DADOS DE TESTE');
      console.log('   - Apenas símbolos TEST encontrados');
      console.log('   - Worker pode não estar conectado às exchanges');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

quickCheck()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  }); 