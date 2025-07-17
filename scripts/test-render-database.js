const { PrismaClient } = require('@prisma/client');

async function testRenderDatabase() {
  console.log('🔍 TESTANDO CONEXÃO COM BANCO DE DADOS DA RENDER');
  console.log('================================================\n');

  // Verificar se a variável de ambiente está definida
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL não está definida');
    console.log('💡 Verifique se o arquivo .env existe e contém a variável DATABASE_URL');
    return;
  }

  console.log('✅ DATABASE_URL encontrada');
  console.log(`📊 URL: ${databaseUrl.substring(0, 20)}...${databaseUrl.substring(databaseUrl.length - 10)}`);
  
  // Verificar se é uma URL da Render
  if (databaseUrl.includes('render.com')) {
    console.log('🌐 Banco de dados da Render detectado');
  } else {
    console.log('⚠️  Não parece ser um banco da Render');
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    console.log('\n🔌 Tentando conectar...');
    const startTime = Date.now();
    
    await prisma.$connect();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Conexão estabelecida em ${duration}ms`);
    
    // Testar consulta simples
    console.log('\n📊 Testando consulta...');
    const tableCount = await prisma.spreadHistory.count();
    console.log(`✅ Tabela SpreadHistory: ${tableCount} registros`);
    
    // Verificar registros recentes
    if (tableCount > 0) {
      const recentRecords = await prisma.spreadHistory.findMany({
        take: 3,
        orderBy: { timestamp: 'desc' },
        select: {
          symbol: true,
          timestamp: true,
          spotPrice: true,
          futuresPrice: true,
          spread: true
        }
      });
      
      console.log('\n📅 ÚLTIMOS 3 REGISTROS:');
      recentRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${record.symbol} - ${record.timestamp.toISOString()}`);
        console.log(`   Spot: $${record.spotPrice}, Futures: $${record.futuresPrice}, Spread: ${record.spread}%`);
      });
    } else {
      console.log('⚠️  Nenhum registro encontrado no banco');
    }
    
    // Testar performance
    console.log('\n⚡ Testando performance...');
    const perfStart = Date.now();
    
    await prisma.spreadHistory.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' }
    });
    
    const perfEnd = Date.now();
    const perfDuration = perfEnd - perfStart;
    
    console.log(`✅ Consulta de 100 registros: ${perfDuration}ms`);
    
    if (perfDuration < 1000) {
      console.log('🚀 Performance excelente!');
    } else if (perfDuration < 3000) {
      console.log('⚠️  Performance moderada');
    } else {
      console.log('🐌 Performance lenta');
    }
    
    // Verificar estrutura da tabela
    console.log('\n🏗️  Verificando estrutura da tabela...');
    try {
      const sampleRecord = await prisma.spreadHistory.findFirst({
        select: {
          id: true,
          symbol: true,
          spotPrice: true,
          futuresPrice: true,
          spread: true,
          timestamp: true
        }
      });
      
      if (sampleRecord) {
        console.log('✅ Estrutura da tabela válida');
        console.log('📋 Campos disponíveis: id, symbol, spotPrice, futuresPrice, spread, timestamp');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar estrutura:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Possível problema:');
      console.log('   - Banco de dados não está rodando');
      console.log('   - URL incorreta');
      console.log('   - Firewall bloqueando conexão');
    } else if (error.message.includes('authentication')) {
      console.log('💡 Possível problema:');
      console.log('   - Credenciais incorretas');
      console.log('   - Usuário sem permissões');
    } else if (error.message.includes('database')) {
      console.log('💡 Possível problema:');
      console.log('   - Banco de dados não existe');
      console.log('   - Schema não criado');
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar teste
testRenderDatabase().catch(console.error); 