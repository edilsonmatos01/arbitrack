const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPositions() {
  try {
    console.log('🔍 Verificando posições no banco de dados...');
    
    const positions = await prisma.position.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Encontradas ${positions.length} posições:`);
    
    positions.forEach((position, index) => {
      console.log(`\n${index + 1}. Posição ID: ${position.id}`);
      console.log(`   Símbolo: "${position.symbol}"`);
      console.log(`   Quantidade: ${position.quantity}`);
      console.log(`   Spot Entry: ${position.spotEntry}`);
      console.log(`   Futures Entry: ${position.futuresEntry}`);
      console.log(`   Spot Exchange: ${position.spotExchange}`);
      console.log(`   Futures Exchange: ${position.futuresExchange}`);
      console.log(`   Simulada: ${position.isSimulated}`);
      console.log(`   Criada em: ${position.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar posições:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPositions(); 