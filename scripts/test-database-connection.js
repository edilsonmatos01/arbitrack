require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 TESTANDO CONEXÃO COM BANCO DE DADOS');
  console.log('=====================================\n');
  
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';
  
  console.log('📊 Configuração:');
  console.log(`🌐 URL: ${DATABASE_URL.substring(0, 50)}...`);
  console.log(`🔧 SSL: require`);
  console.log(`⏱️  Timeout: 60s`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL + '?sslmode=require&connect_timeout=60&application_name=arbitragem',
      },
    },
    log: ['error', 'warn'],
  });
  
  try {
    console.log('\n🔌 Tentando conectar...');
    const startTime = Date.now();
    
    // Teste 1: Conexão básica
    await prisma.$queryRaw`SELECT 1 as test`;
    const connectTime = Date.now() - startTime;
    
    console.log(`✅ Conexão estabelecida em ${connectTime}ms`);
    
    // Teste 2: Contar registros
    console.log('\n📊 Testando tabelas...');
    
    const spreadCount = await prisma.spreadHistory.count();
    console.log(`📈 SpreadHistory: ${spreadCount} registros`);
    
    const positionCount = await prisma.position.count();
    console.log(`📋 Position: ${positionCount} registros`);
    
    // Teste 3: Buscar dados de exemplo
    console.log('\n📋 Buscando dados de exemplo...');
    
    const sampleSpreads = await prisma.spreadHistory.findMany({
      take: 3,
      select: {
        symbol: true,
        spread: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    console.log('📈 Spreads de exemplo:');
    sampleSpreads.forEach((spread, index) => {
      console.log(`  ${index + 1}. ${spread.symbol}: ${spread.spread}% (${spread.timestamp})`);
    });
    
    const samplePositions = await prisma.position.findMany({
      take: 3,
      select: {
        id: true,
        symbol: true,
        quantity: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📋 Posições de exemplo:');
    samplePositions.forEach((position, index) => {
      console.log(`  ${index + 1}. ${position.symbol}: ${position.quantity} (${position.createdAt})`);
    });
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Banco de dados funcionando perfeitamente');
    
  } catch (error) {
    console.error('\n❌ ERRO NA CONEXÃO:');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    console.error('Stack:', error.stack);
    
    if (error.code === 'P1017') {
      console.log('\n💡 SUGESTÃO: Problema de conexão com o banco');
      console.log('   - Verificar se o banco está ativo no Render');
      console.log('   - Verificar configurações de rede');
      console.log('   - Verificar variáveis de ambiente');
    } else if (error.code === 'P1001') {
      console.log('\n💡 SUGESTÃO: Timeout na conexão');
      console.log('   - Verificar conectividade de rede');
      console.log('   - Verificar firewall/proxy');
    }
    
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão fechada');
  }
}

testDatabaseConnection(); 