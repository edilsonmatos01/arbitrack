const { PrismaClient } = require('@prisma/client');

async function checkDatabaseData() {
  console.log('🔍 VERIFICANDO DADOS DO BANCO DE DADOS');
  console.log('=====================================\n');

  const prisma = new PrismaClient();

  try {
    // 1. Verificar tabela SpreadHistory
    console.log('1️⃣ VERIFICANDO TABELA SPREADHISTORY');
    console.log('-----------------------------------');
    
    const totalRecords = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('❌ NENHUM REGISTRO ENCONTRADO!');
      console.log('💡 O banco está vazio. Os dados podem ser simulados ou não estão sendo salvos.');
      return;
    }

    // Verificar registros recentes
    const recentRecords = await prisma.spreadHistory.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        symbol: true,
        timestamp: true,
        spotPrice: true,
        futuresPrice: true,
        spread: true
      }
    });

    console.log('\n📅 ÚLTIMOS 5 REGISTROS:');
    recentRecords.forEach((record, index) => {
      console.log(`${index + 1}. ${record.symbol} - ${record.timestamp.toISOString()}`);
      console.log(`   Spot: ${record.spotPrice}, Futures: ${record.futuresPrice}, Spread: ${record.spread}%`);
    });

    // 2. Verificar símbolos disponíveis
    console.log('\n2️⃣ SÍMBOLOS DISPONÍVEIS');
    console.log('------------------------');
    
    const symbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: { symbol: true }
    });

    console.log(`📈 ${symbols.length} símbolos encontrados:`);
    symbols.forEach(symbol => {
      console.log(`   - ${symbol.symbol}: ${symbol._count.symbol} registros`);
    });

    // 3. Verificar dados zerados
    console.log('\n3️⃣ VERIFICANDO DADOS ZERADOS');
    console.log('-----------------------------');
    
    const zeroSpotRecords = await prisma.spreadHistory.count({
      where: { spotPrice: 0 }
    });
    
    const zeroFuturesRecords = await prisma.spreadHistory.count({
      where: { futuresPrice: 0 }
    });
    
    const zeroSpreadRecords = await prisma.spreadHistory.count({
      where: { spread: 0 }
    });

    console.log(`🔴 Registros com spotPrice = 0: ${zeroSpotRecords} (${((zeroSpotRecords / totalRecords) * 100).toFixed(1)}%)`);
    console.log(`🔴 Registros com futuresPrice = 0: ${zeroFuturesRecords} (${((zeroFuturesRecords / totalRecords) * 100).toFixed(1)}%)`);
    console.log(`🔴 Registros com spread = 0: ${zeroSpreadRecords} (${((zeroSpreadRecords / totalRecords) * 100).toFixed(1)}%)`);

    // 4. Verificar dados válidos
    console.log('\n4️⃣ VERIFICANDO DADOS VÁLIDOS');
    console.log('-----------------------------');
    
    const validRecords = await prisma.spreadHistory.findMany({
      where: {
        spotPrice: { gt: 0 },
        futuresPrice: { gt: 0 },
        spread: { gt: 0 }
      },
      take: 5,
      orderBy: { timestamp: 'desc' },
      select: {
        symbol: true,
        timestamp: true,
        spotPrice: true,
        futuresPrice: true,
        spread: true
      }
    });

    if (validRecords.length > 0) {
      console.log('✅ DADOS VÁLIDOS ENCONTRADOS:');
      validRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${record.symbol} - ${record.timestamp.toISOString()}`);
        console.log(`   Spot: $${record.spotPrice}, Futures: $${record.futuresPrice}, Spread: ${record.spread}%`);
      });
    } else {
      console.log('❌ NENHUM DADO VÁLIDO ENCONTRADO!');
      console.log('💡 Todos os registros têm preços zerados ou spreads inválidos.');
    }

    // 5. Verificar período dos dados
    console.log('\n5️⃣ PERÍODO DOS DADOS');
    console.log('---------------------');
    
    const oldestRecord = await prisma.spreadHistory.findFirst({
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true, symbol: true }
    });
    
    const newestRecord = await prisma.spreadHistory.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true, symbol: true }
    });

    if (oldestRecord && newestRecord) {
      console.log(`📅 Registro mais antigo: ${oldestRecord.timestamp.toISOString()} (${oldestRecord.symbol})`);
      console.log(`📅 Registro mais recente: ${newestRecord.timestamp.toISOString()} (${newestRecord.symbol})`);
      
      const timeDiff = newestRecord.timestamp.getTime() - oldestRecord.timestamp.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      console.log(`⏱️  Período coberto: ${hoursDiff.toFixed(1)} horas`);
    }

    // 6. Recomendações
    console.log('\n6️⃣ RECOMENDAÇÕES');
    console.log('-----------------');
    
    if (totalRecords === 0) {
      console.log('🚨 PROBLEMA CRÍTICO: Banco de dados vazio');
      console.log('   - Verifique se o worker está rodando');
      console.log('   - Verifique se as APIs das exchanges estão funcionando');
      console.log('   - Verifique se há erros nos logs do worker');
    } else if (zeroSpotRecords > totalRecords * 0.8) {
      console.log('⚠️  PROBLEMA: Muitos dados zerados');
      console.log('   - Verifique se as APIs das exchanges estão retornando dados');
      console.log('   - Verifique se há problemas de conectividade');
      console.log('   - Considere limpar dados inválidos');
    } else {
      console.log('✅ DADOS APARENTEMENTE VÁLIDOS');
      console.log('   - O banco contém dados reais');
      console.log('   - Os gráficos devem funcionar corretamente');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseData().catch(console.error); 