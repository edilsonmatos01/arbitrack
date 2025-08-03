const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida!');
    
    // Inserir um registro de teste
    const testRecord = await prisma.spreadHistory.create({
      data: {
        symbol: 'TEST_CONNECTION',
        spread: 1.2345,
        spotPrice: 100.50,
        futuresPrice: 101.75,
        exchangeBuy: 'test_gateio',
        exchangeSell: 'test_mexc',
        direction: 'test_spot_to_futures',
        timestamp: new Date()
      }
    });
    
    console.log('✅ Registro de teste inserido:', testRecord.id);
    
    // Verificar se foi salvo
    const savedRecord = await prisma.spreadHistory.findUnique({
      where: { id: testRecord.id }
    });
    
    if (savedRecord) {
      console.log('✅ Registro encontrado no banco:');
      console.log(`   ID: ${savedRecord.id}`);
      console.log(`   Symbol: ${savedRecord.symbol}`);
      console.log(`   Spread: ${savedRecord.spread}%`);
      console.log(`   Spot Price: $${savedRecord.spotPrice}`);
      console.log(`   Futures Price: $${savedRecord.futuresPrice}`);
      console.log(`   Timestamp: ${savedRecord.timestamp}`);
    }
    
    // Limpar o registro de teste
    await prisma.spreadHistory.delete({
      where: { id: testRecord.id }
    });
    console.log('🧹 Registro de teste removido');
    
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco fechada');
  }
}

testDatabaseConnection(); 