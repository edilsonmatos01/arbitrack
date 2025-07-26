const { PrismaClient } = require('@prisma/client');

async function diagnoseTimezoneAndSpread() {
  console.log('🔍 DIAGNÓSTICO DE TIMEZONE E SPREAD MÁXIMO 24H');
  console.log('================================================\n');

  const prisma = new PrismaClient();

  try {
    // 1. Verificar configuração de timezone
    console.log('1️⃣ VERIFICANDO CONFIGURAÇÃO DE TIMEZONE');
    console.log('TZ Environment Variable:', process.env.TZ || 'Não definida');
    console.log('Data atual (UTC):', new Date().toISOString());
    console.log('Data atual (local):', new Date().toString());
    
    // Testar conversão para São Paulo
    const now = new Date();
    const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    console.log('Data em São Paulo:', saoPauloTime.toString());
    console.log('Diferença UTC-SP:', (now.getTime() - saoPauloTime.getTime()) / (1000 * 60 * 60), 'horas\n');

    // 2. Verificar dados do banco
    console.log('2️⃣ VERIFICANDO DADOS DO BANCO');
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');

    // Contar registros por símbolo
    const symbolCounts = await prisma.spreadHistory.groupBy({
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

    console.log('📊 Top 10 símbolos com mais registros:');
    symbolCounts.forEach((count, index) => {
      console.log(`${index + 1}. ${count.symbol}: ${count._count.symbol} registros`);
    });

    // 3. Testar API de spread máximo para alguns símbolos
    console.log('\n3️⃣ TESTANDO API DE SPREAD MÁXIMO');
    const testSymbols = symbolCounts.slice(0, 5).map(c => c.symbol);
    
    for (const symbol of testSymbols) {
      console.log(`\n🔍 Testando ${symbol}:`);
      
      // Buscar dados das últimas 24h
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const records = await prisma.spreadHistory.findMany({
        where: {
          symbol: symbol,
          timestamp: {
            gte: twentyFourHoursAgo,
          },
        },
        select: {
          spread: true,
          timestamp: true,
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 5
      });

      console.log(`   Registros nas últimas 24h: ${records.length}`);
      
      if (records.length > 0) {
        const spreads = records.map(r => r.spread);
        const maxSpread = Math.max(...spreads);
        const minSpread = Math.min(...spreads);
        const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
        
        console.log(`   Spread máximo: ${maxSpread.toFixed(4)}%`);
        console.log(`   Spread mínimo: ${minSpread.toFixed(4)}%`);
        console.log(`   Spread médio: ${avgSpread.toFixed(4)}%`);
        console.log(`   Último registro: ${records[0].timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      } else {
        console.log('   ❌ Nenhum registro encontrado');
      }
    }

    // 4. Verificar problemas de timezone nos dados
    console.log('\n4️⃣ VERIFICANDO PROBLEMAS DE TIMEZONE NOS DADOS');
    
    // Buscar registros recentes e verificar timestamps
    const recentRecords = await prisma.spreadHistory.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        symbol: true,
        timestamp: true,
        spread: true
      }
    });

    console.log('📅 Últimos 10 registros (verificação de timezone):');
    recentRecords.forEach((record, index) => {
      const utcTime = record.timestamp.toISOString();
      const localTime = record.timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const utcHour = record.timestamp.getUTCHours();
      const localHour = new Date(record.timestamp.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours();
      
      console.log(`${index + 1}. ${record.symbol}:`);
      console.log(`   UTC: ${utcTime} (hora UTC: ${utcHour})`);
      console.log(`   Local: ${localTime} (hora local: ${localHour})`);
      console.log(`   Spread: ${record.spread.toFixed(4)}%`);
      console.log(`   Diferença UTC-Local: ${utcHour - localHour} horas`);
    });

    // 5. Verificar se há dados suficientes para calcular spread máximo
    console.log('\n5️⃣ VERIFICANDO DADOS PARA CÁLCULO DE SPREAD MÁXIMO');
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const symbolsWithData = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      _count: {
        id: true
      },
      where: {
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      having: {
        id: {
          _count: {
            gte: 2
          }
        }
      }
    });

    console.log(`✅ Símbolos com dados suficientes (≥2 registros nas últimas 24h): ${symbolsWithData.length}`);
    
    if (symbolsWithData.length > 0) {
      console.log('📋 Lista de símbolos com dados válidos:');
      symbolsWithData.slice(0, 10).forEach((symbol, index) => {
        console.log(`${index + 1}. ${symbol.symbol}: ${symbol._count.id} registros`);
      });
    } else {
      console.log('❌ Nenhum símbolo tem dados suficientes para calcular spread máximo');
    }

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão com banco fechada');
  }
}

// Executar diagnóstico
diagnoseTimezoneAndSpread().catch(console.error); 