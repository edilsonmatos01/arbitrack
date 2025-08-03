const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkWorkerVersion() {
  try {
    console.log('🔍 Verificando versão do worker na Render...');
    
    await prisma.$connect();
    console.log('✅ Conexão estabelecida');
    
    // Verificar registros das últimas2oras
    const twoHoursAgo = new Date(Date.now() - 260 * 60 * 1000);
    const recentRecords = await prisma.spreadHistory.findMany({
      where: {
        timestamp: { gte: twoHoursAgo }
      },
      orderBy: [{ timestamp: 'desc' }],
      take: 20,
    });
    
    console.log(`📊 Registros das últimas2s: ${recentRecords.length}`);
    
    if (recentRecords.length === 0) {
      console.log('⚠️ Nenhum registro recente encontrado - worker pode estar parado');
      return;
    }
    
    // Analisar se os preços estão sendo salvos
    let withPrices = 0;
    let withoutPrices = 0;
    
    console.log('\n📋 Análise dos registros mais recentes:');
    recentRecords.forEach((record, index) => {
      const hasPrices = record.spotPrice > 0 && record.futuresPrice > 0;
      if (hasPrices) withPrices++;
      else withoutPrices++;
      
      console.log(`  ${index + 1}. ${record.symbol} - Spread: ${record.spread}% - Spot: ${record.spotPrice} - Futures: ${record.futuresPrice} - ${record.timestamp}`);
    });
    
    console.log(`\n📈 Resultado:`);
    console.log(`   Com preços: ${withPrices}`);
    console.log(`   Sem preços: ${withoutPrices}`);
    console.log(`   Percentual com preços: ${((withPrices / recentRecords.length) *100).toFixed(2)}%`);
    
    // Verificar se o worker está ativo (registros a cada poucos minutos)
    const lastRecord = recentRecords[0];
    const timeDiff = Date.now() - lastRecord.timestamp.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    
    console.log(`\n⏰ Último registro: ${minutesDiff} minutos atrás`);
    
    if (minutesDiff < 10) {
      console.log('✅ Worker está ativo e gravando dados recentemente');
    } else if (minutesDiff < 30) {
      console.log('⚠️ Worker pode estar com problemas - dados não muito recentes');
    } else {
      console.log('❌ Worker pode estar parado - dados muito antigos');
    }
    
    // Verificar se a correção está funcionando
    if (withPrices > 0) {
      console.log('✅ Correção dos preços está funcionando!');
    } else {
      console.log('❌ Correção dos preços NÃO está funcionando');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkerVersion(); 