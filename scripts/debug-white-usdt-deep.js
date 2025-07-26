const { PrismaClient } = require('@prisma/client');

async function debugWhiteUSDDeep() {
  console.log('🔍 INVESTIGAÇÃO PROFUNDA - WHITE_USDT');
  console.log('=====================================\n');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    
    const symbol = 'WHITE_USDT';
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    console.log(`📊 Investigando: ${symbol}`);
    console.log(`🕐 Período: ${start.toISOString()} até ${now.toISOString()}`);
    console.log(`🌍 Horário atual (Brasil): ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // 1. Verificar todos os registros das últimas 24h
    console.log('\n📡 1. Verificando todos os registros das últimas 24h...');
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
      }
    });
    
    console.log(`📊 Total de registros encontrados: ${allRecords.length}`);
    
    if (allRecords.length > 0) {
      console.log(`🕐 Primeiro registro: ${allRecords[0].timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log(`🕐 Último registro: ${allRecords[allRecords.length - 1].timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      
      // 2. Verificar distribuição por hora
      console.log('\n📡 2. Distribuição por hora (últimas 5 horas):');
      const last5Hours = allRecords.filter(record => {
        const recordHour = record.timestamp.getHours();
        const currentHour = now.getHours();
        return recordHour >= currentHour - 5;
      });
      
      console.log(`📊 Registros nas últimas 5 horas: ${last5Hours.length}`);
      
      if (last5Hours.length > 0) {
        const hourGroups = {};
        last5Hours.forEach(record => {
          const hour = record.timestamp.getHours();
          if (!hourGroups[hour]) hourGroups[hour] = [];
          hourGroups[hour].push(record);
        });
        
        Object.keys(hourGroups).sort().forEach(hour => {
          console.log(`  ${hour}:00 - ${hourGroups[hour].length} registros`);
        });
      }
      
      // 3. Verificar se há registros recentes (última hora)
      console.log('\n📡 3. Verificando registros da última hora...');
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const recentRecords = allRecords.filter(record => record.timestamp >= oneHourAgo);
      
      console.log(`📊 Registros na última hora: ${recentRecords.length}`);
      
      if (recentRecords.length > 0) {
        console.log('🕐 Registros recentes:');
        recentRecords.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${record.spread}%`);
        });
      } else {
        console.log('⚠️  NENHUM REGISTRO NA ÚLTIMA HORA!');
      }
      
      // 4. Verificar se há registros com spread > 0
      console.log('\n📡 4. Verificando registros com spread > 0...');
      const positiveSpreads = allRecords.filter(record => record.spread > 0);
      console.log(`📊 Registros com spread > 0: ${positiveSpreads.length}`);
      
      if (positiveSpreads.length > 0) {
        console.log(`🕐 Último registro com spread > 0: ${positiveSpreads[positiveSpreads.length - 1].timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      }
      
      // 5. Simular o agrupamento da API
      console.log('\n📡 5. Simulando agrupamento da API...');
      
      // Função de agrupamento similar à API
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
      
      console.log(`📊 Dados agrupados simulados: ${formattedData.length} pontos`);
      
      if (formattedData.length > 0) {
        console.log(`🕐 Primeiro ponto simulado: ${formattedData[0].timestamp}`);
        console.log(`🕐 Último ponto simulado: ${formattedData[formattedData.length - 1].timestamp}`);
        
        // Mostrar os últimos 5 pontos simulados
        console.log('\n📋 Últimos 5 pontos simulados:');
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

debugWhiteUSDDeep(); 