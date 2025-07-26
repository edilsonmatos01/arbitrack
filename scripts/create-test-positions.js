const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestPositions() {
  try {
    console.log('🔧 Criando posições de teste...');
    
    // Primeiro, limpar posições existentes
    await prisma.position.deleteMany({});
    console.log('✅ Posições existentes removidas');
    
    // Criar posição para CBK
    const cbkPosition = await prisma.position.create({
      data: {
        symbol: 'CBK',
        quantity: 10000,
        spotEntry: 0.6488,
        futuresEntry: 0.651,
        spotExchange: 'gateio',
        futuresExchange: 'mexc',
        isSimulated: true
      }
    });
    
    console.log('✅ Posição CBK criada:', cbkPosition.id);
    
    // Criar posição para FARM (se não existir)
    const farmPosition = await prisma.position.create({
      data: {
        symbol: 'FARM',
        quantity: 10000,
        spotEntry: 28.60,
        futuresEntry: 28.74,
        spotExchange: 'gateio',
        futuresExchange: 'mexc',
        isSimulated: true
      }
    });
    
    console.log('✅ Posição FARM criada:', farmPosition.id);
    
    // Verificar posições criadas
    const positions = await prisma.position.findMany();
    console.log(`\n📊 Total de posições: ${positions.length}`);
    
    positions.forEach((position, index) => {
      console.log(`\n${index + 1}. ${position.symbol}:`);
      console.log(`   ID: ${position.id}`);
      console.log(`   Quantidade: ${position.quantity}`);
      console.log(`   Spot Entry: ${position.spotEntry}`);
      console.log(`   Futures Entry: ${position.futuresEntry}`);
      console.log(`   Simulada: ${position.isSimulated}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar posições:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPositions(); 