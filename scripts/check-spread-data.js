"use strict";
const { PrismaClient } = require('@prisma/client');

console.log('🔍 VERIFICANDO DADOS DE SPREAD NO BANCO');
console.log('========================================');

async function checkSpreadData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📡 Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!');
    
    // Verificar se há dados na tabela SpreadHistory
    console.log('\n📊 Verificando tabela SpreadHistory...');
    
    const totalRecords = await prisma.spreadHistory.count();
    console.log(`📈 Total de registros: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('❌ Nenhum registro encontrado na tabela SpreadHistory');
      console.log('⚠️ O worker pode não estar salvando dados no banco');
      return;
    }
    
    // Verificar registros das últimas 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentRecords = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          gte: twentyFourHoursAgo
        }
      }
    });
    
    console.log(`📈 Registros das últimas 24h: ${recentRecords}`);
    
    // Verificar símbolos únicos
    const uniqueSymbols = await prisma.spreadHistory.findMany({
      select: {
        symbol: true
      },
      distinct: ['symbol']
    });
    
    console.log(`📈 Símbolos únicos: ${uniqueSymbols.length}`);
    console.log('📋 Símbolos:', uniqueSymbols.map(s => s.symbol).join(', '));
    
    // Verificar registros mais recentes
    console.log('\n📊 Últimos 5 registros:');
    const recentData = await prisma.spreadHistory.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 5,
      select: {
        symbol: true,
        spread: true,
        timestamp: true,
        exchangeBuy: true,
        exchangeSell: true
      }
    });
    
    recentData.forEach((record, index) => {
      console.log(`${index + 1}. ${record.symbol}: ${record.spread}% (${record.exchangeBuy} → ${record.exchangeSell}) - ${record.timestamp.toISOString()}`);
    });
    
    // Verificar spread máximo por símbolo nas últimas 24h
    console.log('\n📊 Spread máximo por símbolo (últimas 24h):');
    
    const maxSpreads = await prisma.spreadHistory.groupBy({
      by: ['symbol'],
      where: {
        timestamp: {
          gte: twentyFourHoursAgo
        }
      },
      _max: {
        spread: true
      },
      _count: {
        id: true
      }
    });
    
    maxSpreads.forEach((item, index) => {
      console.log(`${index + 1}. ${item.symbol}: ${item._max.spread}% (${item._count.id} registros)`);
    });
    
    // Verificar se há dados para símbolos específicos da tabela
    console.log('\n📊 Verificando símbolos específicos da tabela:');
    const tableSymbols = ['VR_USDT', 'VVAIFU_USDT', 'DODO_USDT', 'GORK_USDT'];
    
    for (const symbol of tableSymbols) {
      const symbolData = await prisma.spreadHistory.findMany({
        where: {
          symbol: symbol,
          timestamp: {
            gte: twentyFourHoursAgo
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 1
      });
      
      if (symbolData.length > 0) {
        console.log(`✅ ${symbol}: ${symbolData[0].spread}% (${symbolData[0].timestamp.toISOString()})`);
      } else {
        console.log(`❌ ${symbol}: Nenhum dado encontrado`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão fechada');
  }
}

checkSpreadData().catch(console.error);
