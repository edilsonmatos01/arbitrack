const { PrismaClient } = require('@prisma/client');

async function debugAPILimit() {
  console.log('🔍 INVESTIGANDO LIMITE DA API - WHITE_USDT');
  console.log('==========================================\n');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    
    const symbol = 'WHITE_USDT';
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    console.log(`📊 Investigando: ${symbol}`);
    console.log(`🕐 Período: ${start.toISOString()} até ${now.toISOString()}`);
    
    // 1. Verificar se há limite na consulta
    console.log('\n📡 1. Testando consulta com diferentes limites...');
    
    const limits = [1000, 5000, 10000, 20000, 50000];
    
    for (const limit of limits) {
      console.log(`\n🔍 Testando com limite: ${limit}`);
      
      const records = await prisma.spreadHistory.findMany({
        where: {
          symbol: symbol,
          timestamp: {
            gte: start,
            lte: now
          },
          spread: { gt: 0 }
        },
        select: {
          timestamp: true,
          spread: true
        },
        orderBy: {
          timestamp: 'asc'
        },
        take: limit
      });
      
      console.log(`📊 Registros encontrados: ${records.length}`);
      
      if (records.length > 0) {
        console.log(`🕐 Primeiro registro: ${records[0].timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        console.log(`🕐 Último registro: ${records[records.length - 1].timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        
        // Verificar se o último registro está próximo do horário atual
        const lastHour = records[records.length - 1].timestamp.getHours();
        const currentHour = now.getHours();
        const hourDiff = Math.abs(currentHour - lastHour);
        
        console.log(`⏰ Diferença de horas: ${hourDiff}h`);
        
        if (hourDiff <= 1) {
          console.log(`✅ LIMITE CORRETO ENCONTRADO: ${limit}`);
          break;
        }
      }
    }
    
    // 2. Verificar se há problema com o agrupamento
    console.log('\n📡 2. Testando agrupamento manual...');
    
    const allRecords = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: start,
          lte: now
        },
        spread: { gt: 0 }
      },
      select: {
        timestamp: true,
        spread: true
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: 50000 // Usar limite alto
    });
    
    console.log(`📊 Total de registros: ${allRecords.length}`);
    
    if (allRecords.length > 0) {
      // Função de agrupamento
      function roundToNearestInterval(date, intervalMinutes) {
        const minutes = Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
        const rounded = new Date(date);
        rounded.setMinutes(minutes, 0, 0);
        return rounded;
      }
      
      function formatDateTime(date) {
        const saoPauloTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const day = saoPauloTime.getDate().toString().padStart(2, '0');
        const month = (saoPauloTime.getMonth() + 1).toString().padStart(2, '0');
        const hour = saoPauloTime.getHours().toString().padStart(2, '0');
        const minute = saoPauloTime.getMinutes().toString().padStart(2, '0');
        return `${day}/${month} - ${hour}:${minute}`;
      }
      
      const grouped = new Map();
      
      for (const record of allRecords) {
        const roundedTime = roundToNearestInterval(record.timestamp, 30);
        const timeKey = formatDateTime(roundedTime);
        
        const existing = grouped.get(timeKey);
        if (existing) {
          existing.max = Math.max(existing.max, record.spread);
          existing.count += 1;
        } else {
          grouped.set(timeKey, { max: record.spread, count: 1 });
        }
      }
      
      const formattedData = Array.from(grouped.entries())
        .map(([timestamp, data]) => ({
          timestamp,
          spread_percentage: data.max
        }))
        .filter(item => item.spread_percentage > 0 && item.timestamp)
        .sort((a, b) => {
          const [dateA, timeA] = a.timestamp.split(' - ');
          const [dateB, timeB] = b.timestamp.split(' - ');
          const [dayA, monthA] = dateA.split('/').map(Number);
          const [dayB, monthB] = dateB.split('/').map(Number);
          const [hourA, minuteA] = timeA.split(':').map(Number);
          const [hourB, minuteB] = timeB.split(':').map(Number);
          
          if (monthA !== monthB) return monthA - monthB;
          if (dayA !== dayB) return dayA - dayB;
          if (hourA !== hourB) return hourA - hourB;
          return minuteA - minuteB;
        });
      
      console.log(`📊 Dados agrupados: ${formattedData.length} pontos`);
      
      if (formattedData.length > 0) {
        console.log(`🕐 Primeiro ponto: ${formattedData[0].timestamp}`);
        console.log(`🕐 Último ponto: ${formattedData[formattedData.length - 1].timestamp}`);
        
        // Mostrar os últimos 5 pontos
        console.log('\n📋 Últimos 5 pontos:');
        const last5 = formattedData.slice(-5);
        last5.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.timestamp}: ${item.spread_percentage}%`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a investigação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAPILimit(); 