const { PrismaClient } = require('@prisma/client');

async function debugSpreadData(symbol) {
  console.log(`🔍 DEBUGANDO DADOS DE SPREAD PARA: ${symbol}`);
  console.log('==========================================\n');

  const prisma = new PrismaClient();

  try {
    // 1. Verificar se há dados no banco para este símbolo
    console.log('1️⃣ VERIFICANDO DADOS NO BANCO...');
    
    const totalRecords = await prisma.spreadHistory.count({
      where: { symbol: symbol }
    });
    
    console.log(`Total de registros para ${symbol}: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('❌ NENHUM REGISTRO ENCONTRADO NO BANCO!');
      return;
    }

    // 2. Verificar dados das últimas 24 horas
    console.log('\n2️⃣ VERIFICANDO DADOS DAS ÚLTIMAS 24H...');
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRecords = await prisma.spreadHistory.count({
      where: {
        symbol: symbol,
        timestamp: {
          gte: twentyFourHoursAgo
        }
      }
    });
    
    console.log(`Registros das últimas 24h: ${recentRecords}`);
    console.log(`Período: ${twentyFourHoursAgo.toISOString()} até agora`);

    // 3. Verificar dados das últimas 7 dias
    console.log('\n3️⃣ VERIFICANDO DADOS DAS ÚLTIMAS 7 DIAS...');
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekRecords = await prisma.spreadHistory.count({
      where: {
        symbol: symbol,
        timestamp: {
          gte: sevenDaysAgo
        }
      }
    });
    
    console.log(`Registros dos últimos 7 dias: ${weekRecords}`);

    // 4. Verificar registros mais recentes
    console.log('\n4️⃣ ÚLTIMOS 5 REGISTROS:');
    
    const recentData = await prisma.spreadHistory.findMany({
      where: { symbol: symbol },
      select: {
        timestamp: true,
        spread: true,
        symbol: true
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    recentData.forEach((record, index) => {
      console.log(`${index + 1}. ${record.timestamp.toISOString()} - Spread: ${record.spread}%`);
    });

    // 5. Verificar se há registros com spread > 0
    console.log('\n5️⃣ VERIFICANDO REGISTROS COM SPREAD > 0...');
    
    const validSpreads = await prisma.spreadHistory.count({
      where: {
        symbol: symbol,
        spread: { gt: 0 }
      }
    });
    
    console.log(`Registros com spread > 0: ${validSpreads}`);

    // 6. Testar a consulta exata da API
    console.log('\n6️⃣ TESTANDO CONSULTA DA API...');
    
    const apiQuery = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: twentyFourHoursAgo
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
    
    console.log(`Resultado da consulta da API: ${apiQuery.length} registros`);
    
    if (apiQuery.length > 0) {
      console.log('Primeiros 3 registros:');
      apiQuery.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.timestamp.toISOString()} - ${record.spread}%`);
      });
    }

  } catch (error) {
    console.error('❌ ERRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar para o símbolo fornecido
const symbol = process.argv[2] || 'WHITE_USDT';
debugSpreadData(symbol); 