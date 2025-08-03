// Script para testar o timezone diretamente no banco de dados
const { PrismaClient } = require('@prisma/client');
const { toZonedTime, format } = require('date-fns-tz');

console.log('=== TESTE DE TIMEZONE NO BANCO DE DADOS ===');

// Configurar Prisma
const prisma = new PrismaClient();

async function testDatabaseTimezone() {
  try {
    console.log('Configurações:');
    console.log('- TZ:', process.env.TZ);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Definida' : 'Não definida');

    // Teste 1: Verificar configuração do banco
    console.log('\n=== TESTE 1: CONFIGURAÇÃO DO BANCO ===');
    
    const dbConfig = await prisma.$queryRaw`SELECT current_setting('timezone') as timezone`;
    console.log('Timezone do banco:', dbConfig[0].timezone);
    
    const nowQuery = await prisma.$queryRaw`SELECT NOW() as now, CURRENT_TIMESTAMP as current_timestamp`;
    console.log('Agora (banco):', nowQuery[0].now);
    console.log('Current timestamp (banco):', nowQuery[0].current_timestamp);

    // Teste 2: Verificar dados reais do banco
    console.log('\n=== TESTE 2: DADOS REAIS DO BANCO ===');
    
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    console.log('Intervalo de busca:');
    console.log('- Início (UTC):', start.toISOString());
    console.log('- Fim (UTC):', now.toISOString());
    
    // Buscar dados reais
    const spreadHistory = await prisma.spreadHistory.findMany({
      where: {
        timestamp: {
          gte: start,
          lte: now
        }
      },
      select: {
        timestamp: true,
        spread: true,
        symbol: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10 // Apenas os 10 mais recentes
    });
    
    console.log(`\nEncontrados ${spreadHistory.length} registros recentes:`);
    spreadHistory.forEach((record, index) => {
      console.log(`${index + 1}. ${record.symbol}: ${record.timestamp.toISOString()} -> ${record.spread}%`);
    });

    if (spreadHistory.length === 0) {
      console.log('⚠️  Nenhum dado encontrado no banco. Verificando se há dados mais antigos...');
      
      const allData = await prisma.spreadHistory.findMany({
        select: {
          timestamp: true,
          spread: true,
          symbol: true
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 5
      });
      
      if (allData.length > 0) {
        console.log('Dados mais antigos encontrados:');
        allData.forEach((record, index) => {
          console.log(`${index + 1}. ${record.symbol}: ${record.timestamp.toISOString()} -> ${record.spread}%`);
        });
      } else {
        console.log('❌ Nenhum dado encontrado no banco de dados.');
        return;
      }
    }

    // Teste 3: Processar dados como na API
    console.log('\n=== TESTE 3: PROCESSAMENTO COMO NA API ===');
    
    if (spreadHistory.length > 0) {
      const symbol = spreadHistory[0].symbol;
      console.log(`Processando dados para ${symbol}...`);
      
      // Buscar dados específicos do símbolo
      const symbolData = await prisma.spreadHistory.findMany({
        where: {
          symbol: symbol,
          timestamp: {
            gte: start,
            lte: now
          }
        },
        select: {
          timestamp: true,
          spread: true
        },
        orderBy: {
          timestamp: 'asc'
        }
      });
      
      console.log(`Dados para ${symbol}: ${symbolData.length} registros`);
      
      // Processar como na API Spread 24h
      const groupedData = new Map();
      
      // Criar intervalos no fuso de São Paulo
      const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
      const startInSaoPaulo = toZonedTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'America/Sao_Paulo');
      
      console.log('Intervalos em São Paulo:');
      console.log('- Início:', format(nowInSaoPaulo, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' }));
      console.log('- Fim:', format(startInSaoPaulo, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' }));
      
      // Criar buckets de tempo
      let currentTime = new Date(startInSaoPaulo);
      const endTime = new Date(nowInSaoPaulo);
      
      while (currentTime <= endTime) {
        const timeKey = format(currentTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
        groupedData.set(timeKey, 0);
        currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
      }
      
      console.log(`Buckets criados: ${groupedData.size}`);
      
      // Processar dados
      for (const record of symbolData) {
        const recordInSaoPaulo = toZonedTime(record.timestamp, 'America/Sao_Paulo');
        const timeKey = format(recordInSaoPaulo, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
        
        const currentMax = groupedData.get(timeKey) || 0;
        groupedData.set(timeKey, Math.max(currentMax, record.spread));
      }
      
      // Mostrar resultado
      console.log('\nResultado final (primeiros 10):');
      const result = Array.from(groupedData.entries())
        .map(([timestamp, spread]) => ({ timestamp, spread_percentage: spread }))
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
        })
        .slice(0, 10);
      
      result.forEach(item => {
        console.log(`- ${item.timestamp}: ${item.spread_percentage}%`);
      });
    }

    // Teste 4: Verificar se há diferença entre UTC e timezone local
    console.log('\n=== TESTE 4: COMPARAÇÃO UTC vs TIMEZONE ===');
    
    const testDate = new Date();
    console.log('Data atual (local):', testDate.toString());
    console.log('Data atual (UTC):', testDate.toISOString());
    
    const converted = toZonedTime(testDate, 'America/Sao_Paulo');
    console.log('Convertida para São Paulo:', format(converted, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' }));
    
    // Verificar offset
    const offset = testDate.getTimezoneOffset();
    console.log('Timezone offset (minutos):', offset);
    console.log('Timezone offset (horas):', offset / 60);

  } catch (error) {
    console.error('Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testDatabaseTimezone().then(() => {
  console.log('\n=== FIM DO TESTE ===');
}).catch(error => {
  console.error('Erro fatal:', error);
}); 