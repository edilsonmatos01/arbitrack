const { PrismaClient } = require('@prisma/client');

async function checkSymbolsData() {
  console.log('🔍 VERIFICANDO DADOS POR SÍMBOLO');
  console.log('================================\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados\n');

    // Buscar todos os símbolos únicos
    const symbols = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: { symbol: true }
    });

    console.log(`📊 ${symbols.length} símbolos encontrados:\n`);

    for (const symbolData of symbols) {
      const symbol = symbolData.symbol;
      const count = symbolData._count.symbol;

      // Buscar dados mais recentes
      const latestData = await prisma.spreadHistory.findFirst({
        where: { symbol: symbol },
        orderBy: { timestamp: 'desc' },
        select: {
          timestamp: true,
          spread: true,
          spotPrice: true,
          futuresPrice: true
        }
      });

      // Buscar dados das últimas 24h
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await prisma.spreadHistory.count({
        where: {
          symbol: symbol,
          timestamp: { gte: last24h }
        }
      });

      // Calcular spread máximo das últimas 24h
      const maxSpread = await prisma.spreadHistory.findFirst({
        where: {
          symbol: symbol,
          timestamp: { gte: last24h }
        },
        orderBy: { spread: 'desc' },
        select: { spread: true }
      });

      console.log(`📈 ${symbol}:`);
      console.log(`   📊 Total de registros: ${count}`);
      console.log(`   ⏰ Última atualização: ${latestData?.timestamp?.toISOString() || 'N/A'}`);
      console.log(`   🔄 Registros 24h: ${recentCount}`);
      console.log(`   📈 Spread máximo 24h: ${maxSpread?.spread?.toFixed(2)}%`);
      
      if (latestData) {
        console.log(`   💰 Último preço Spot: $${latestData.spotPrice?.toFixed(2) || 'N/A'}`);
        console.log(`   💰 Último preço Futures: $${latestData.futuresPrice?.toFixed(2) || 'N/A'}`);
      }

      // Status do gráfico
      if (recentCount > 0) {
        console.log(`   ✅ Gráfico disponível (${recentCount} pontos)`);
      } else {
        console.log(`   ❌ Gráfico não disponível (sem dados 24h)`);
      }
      
      console.log('');
    }

    // Verificar símbolos que aparecem na interface mas não têm dados
    const interfaceSymbols = ['ERA_USDT', 'WHITE_USDT', 'MOONPIG_USDT', 'BRISE_USDT', 'HOLD_USDT'];
    
    console.log('🎯 VERIFICAÇÃO DE SÍMBOLOS DA INTERFACE:');
    console.log('========================================\n');

    for (const symbol of interfaceSymbols) {
      const hasData = symbols.some(s => s.symbol === symbol);
      const recentData = await prisma.spreadHistory.count({
        where: {
          symbol: symbol,
          timestamp: { gte: last24h }
        }
      });

      if (hasData && recentData > 0) {
        console.log(`✅ ${symbol}: Dados disponíveis (${recentData} registros 24h)`);
      } else if (hasData && recentData === 0) {
        console.log(`⚠️  ${symbol}: Dados antigos (0 registros 24h)`);
      } else {
        console.log(`❌ ${symbol}: Sem dados no banco`);
      }
    }

    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('==================');
    
    const symbolsWithNoData = interfaceSymbols.filter(symbol => {
      return !symbols.some(s => s.symbol === symbol);
    });

    if (symbolsWithNoData.length > 0) {
      console.log(`🔧 Símbolos sem dados: ${symbolsWithNoData.join(', ')}`);
      console.log('   - O worker deve gerar dados para estes símbolos');
      console.log('   - Verifique se as APIs das exchanges estão funcionando');
    }

    const symbolsWithOldData = interfaceSymbols.filter(async (symbol) => {
      const recentCount = await prisma.spreadHistory.count({
        where: {
          symbol: symbol,
          timestamp: { gte: last24h }
        }
      });
      return recentCount === 0;
    });

    if (symbolsWithOldData.length > 0) {
      console.log(`⏰ Símbolos com dados antigos: ${symbolsWithOldData.join(', ')}`);
      console.log('   - Dados das últimas 24h não encontrados');
      console.log('   - O worker pode não estar funcionando corretamente');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSymbolsData().catch(console.error); 