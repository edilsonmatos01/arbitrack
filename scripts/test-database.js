const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  console.log('🗄️ Testando conexão com o banco de dados...');
  
  let prisma;
  try {
    prisma = new PrismaClient();
    console.log('✅ Prisma Client criado com sucesso');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');
    
    // Verificar se a tabela OperationHistory existe
    console.log('🔍 Verificando tabela OperationHistory...');
    
    // Contar total de operações
    const totalCount = await prisma.operationHistory.count();
    console.log('📊 Total de operações no banco:', totalCount);
    
    if (totalCount > 0) {
      // Buscar todas as operações
      const allOperations = await prisma.operationHistory.findMany({
        orderBy: { finalizedAt: 'desc' },
        take: 10
      });
      
      console.log('📋 Últimas 10 operações:');
      allOperations.forEach((op, index) => {
        console.log(`${index + 1}. ID: ${op.id}`);
        console.log(`   Símbolo: ${op.symbol}`);
        console.log(`   Lucro USD: ${op.profitLossUsd}`);
        console.log(`   Lucro %: ${op.profitLossPercent}`);
        console.log(`   Data: ${op.finalizedAt}`);
        console.log(`   Exchanges: ${op.spotExchange} / ${op.futuresExchange}`);
        console.log('');
      });
      
      // Testar filtro de 24h
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      console.log('⏰ Testando filtro de 24h...');
      console.log('Desde:', twentyFourHoursAgo.toISOString());
      console.log('Até:', now.toISOString());
      
      const recentOperations = await prisma.operationHistory.findMany({
        where: {
          finalizedAt: {
            gte: twentyFourHoursAgo
          }
        },
        orderBy: { finalizedAt: 'desc' }
      });
      
      console.log('📊 Operações nas últimas 24h:', recentOperations.length);
      
      if (recentOperations.length > 0) {
        console.log('📋 Operações recentes:');
        recentOperations.forEach((op, index) => {
          console.log(`${index + 1}. ${op.symbol} - $${op.profitLossUsd} (${op.finalizedAt})`);
        });
      }
      
    } else {
      console.log('⚠️ Nenhuma operação encontrada no banco');
      
      // Verificar estrutura da tabela
      console.log('🔍 Verificando estrutura da tabela...');
      try {
        const sampleQuery = await prisma.$queryRaw`SELECT * FROM "OperationHistory" LIMIT 1`;
        console.log('✅ Tabela existe e é acessível');
      } catch (error) {
        console.error('❌ Erro ao acessar tabela:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com banco:', error.message);
    console.error('❌ Stack trace:', error.stack);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('🔌 Conexão com banco fechada');
    }
  }
}

testDatabase().catch(console.error); 