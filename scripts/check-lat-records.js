const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLATRecords() {
  try {
    console.log('🔍 Verificando registros do LAT_USDT...\n');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // 1. Verificar total de registros na tabela
    const totalRecords = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros na tabela: ${totalRecords}`);

    // 2. Verificar registros do LAT_USDT nas últimas 24h
    const latRecords = await prisma.spreadHistory.findMany({
      where: {
        symbol: 'LAT_USDT',
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        spread: true,
      },
    });

    console.log(`📈 Registros do LAT_USDT nas últimas 24h: ${latRecords.length}`);

    if (latRecords.length < 2) {
      console.log('❌ PROBLEMA: Menos de 2 registros - API retorna dados simulados!');
      console.log(`   Registros encontrados: ${latRecords.length}`);
      
      // Verificar todos os registros do LAT_USDT (sem limite de tempo)
      const allLatRecords = await prisma.spreadHistory.findMany({
        where: {
          symbol: 'LAT_USDT',
        },
        select: {
          timestamp: true,
          spread: true,
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10
      });

      console.log(`\n📋 Últimos 10 registros do LAT_USDT (sem limite de tempo):`);
      allLatRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.spread.toFixed(4)}% - ${record.timestamp.toISOString()}`);
      });
    } else {
      console.log('✅ OK: Mais de 2 registros - API deve retornar dados reais');
      
      const spreads = latRecords.map(r => r.spread);
      const maxSpread = Math.max(...spreads);
      console.log(`   Spread máximo real: ${maxSpread.toFixed(4)}%`);
    }

    // 3. Testar a função generateMockData
    console.log(`\n🧪 Testando função generateMockData para LAT_USDT:`);
    
    function generateMockData(symbol) {
      const symbolHash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const baseSpread = (symbolHash % 50) / 10 + 0.5;
      const variation = Math.sin(Date.now() / 10000) * 0.5;
      const mockSpread = Math.max(0.1, baseSpread + variation);
      
      const mockCrosses = Math.floor(Math.random() * 50) + 20;
      
      return {
        spMax: parseFloat(mockSpread.toFixed(2)),
        crosses: mockCrosses
      };
    }

    const mockData = generateMockData('LAT_USDT');
    console.log(`   Dados simulados gerados:`, mockData);

    // 4. Verificar se há outros símbolos com o mesmo problema
    console.log(`\n🔍 Verificando outros símbolos...`);
    
    const symbolsWithData = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      where: {
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      _count: {
        symbol: true
      }
    });

    const symbolsWithLessThan2 = symbolsWithData.filter(s => s._count.symbol < 2);
    console.log(`   Símbolos com menos de 2 registros: ${symbolsWithLessThan2.length}`);
    
    if (symbolsWithLessThan2.length > 0) {
      console.log(`   Lista de símbolos problemáticos:`);
      symbolsWithLessThan2.forEach(s => {
        console.log(`     - ${s.symbol}: ${s._count.symbol} registros`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLATRecords(); 