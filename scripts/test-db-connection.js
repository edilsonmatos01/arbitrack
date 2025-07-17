const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco...');
    
    // Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar se consegue fazer uma query simples
    const count = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros na tabela SpreadHistory: ${count}`);
    
    // Verificar dados recentes
    const recentData = await prisma.spreadHistory.findMany({
      take: 3,
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    console.log('📈 Últimos 3 registros:');
    recentData.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.symbol} - Spread: ${record.spread}% - Spot: ${record.spotPrice} - Futures: ${record.futuresPrice} - ${record.timestamp}`);
    });
    
    // Verificar se os campos spotPrice e futuresPrice estão sendo preenchidos
    const withPrices = await prisma.spreadHistory.count({
      where: {
        spotPrice: { not: 0 },
        futuresPrice: { not: 0 }
      }
    });
    
    console.log(`💰 Registros com preços preenchidos: ${withPrices}/${count}`);
    
  } catch (error) {
    console.error('Erro na conexão:', error.message);
    
    if (error.code === 'P1001') {
      console.log('💡 Dica: Verifique se o banco está rodando na Render');
    } else if (error.code === 'P2024') {
      console.log('💡 Dica: Pool de conexões esgotado - aguarde um pouco');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 