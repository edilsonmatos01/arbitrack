const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRecordSpread() {
  try {
    console.log('🔍 Testando função recordSpread...');
    
    // Teste 1: Verificar conexão com o banco
    console.log('📊 Verificando conexão com o banco...');
    const count = await prisma.spreadHistory.count();
    console.log('✅ Conexão OK. Total de registros:', count);
    
    // Teste 2: Inserir um registro de teste
    console.log('📝 Inserindo registro de teste...');
    const testRecord = await prisma.spreadHistory.create({
      data: {
        symbol: 'TEST_USDT',
        exchangeBuy: 'gateio',
        exchangeSell: 'mexc',
        direction: 'spot-to-future',
        spread: 1.5,
        spotPrice: 1.0,
        futuresPrice: 1.015,
        timestamp: new Date()
      }
    });
    console.log('✅ Registro de teste criado:', testRecord.id);
    
    // Teste 3: Verificar se o registro foi salvo
    const savedRecord = await prisma.spreadHistory.findUnique({
      where: { id: testRecord.id }
    });
    console.log('✅ Registro recuperado:', savedRecord);
    
    // Teste 4: Limpar registro de teste
    await prisma.spreadHistory.delete({
      where: { id: testRecord.id }
    });
    console.log('✅ Registro de teste removido');
    
    // Teste 5: Verificar registros recentes
    const recentRecords = await prisma.spreadHistory.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    console.log('📊 Registros das últimas 24h:', recentRecords.length);
    recentRecords.forEach(record => {
      console.log(`  - ${record.symbol}: ${record.spread.toFixed(4)}% (${record.timestamp.toLocaleString()})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRecordSpread(); 