console.log('Verificando configuração do ambiente...');

// Verificar variáveis de ambiente
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'Não configurada');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || '10000');

// Verificar se o banco está acessível
const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });

  try {
    console.log('\nTestando conexão com banco...');
    await prisma.$connect();
    console.log('✅ Conexão com banco OK');
    
    // Testar consulta simples
    const count = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros: ${count}`);
    
    // Testar consulta com filtro de tempo
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.spreadHistory.count({
      where: {
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      }
    });
    console.log(`📈 Registros das últimas 24h: ${recentCount}`);
    
    // Testar spread máximo para ERA_USDT
    const maxSpread = await prisma.spreadHistory.findFirst({
      where: {
        symbol: 'ERA_USDT',
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        spread: true
      },
      orderBy: {
        spread: 'desc'
      }
    });
    
    console.log(`📊 Spread máximo ERA_USDT: ${maxSpread?.spread?.toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Erro no banco:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 