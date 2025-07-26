const { PrismaClient } = require('@prisma/client');

async function testProductionDB() {
  console.log('🌐 Testando conexão com banco de produção (Render)...');
  
  // Usar a URL do banco de produção do Render
  const productionUrl = process.env.DATABASE_URL || 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3b19GI5DHmL9x11Xd4I329vT@dpg-d1i63eqdbo4c7387d210-a.oregon-postgres.render.com/arbitragem_banco_bdx8';
  
  console.log('🔗 URL do banco:', productionUrl.replace(/\/\/.*@/, '//***:***@')); // Mascarar credenciais
  
  let prisma;
  try {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: productionUrl
        }
      }
    });
    
    console.log('✅ Prisma Client criado com sucesso');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco de produção estabelecida');
    
    // Verificar se a tabela OperationHistory existe
    console.log('🔍 Verificando tabela OperationHistory...');
    
    // Contar total de operações
    const totalCount = await prisma.operationHistory.count();
    console.log('📊 Total de operações no banco de produção:', totalCount);
    
    if (totalCount > 0) {
      // Buscar todas as operações
      const allOperations = await prisma.operationHistory.findMany({
        orderBy: { finalizedAt: 'desc' },
        take: 5
      });
      
      console.log('📋 Operações no banco de produção:');
      allOperations.forEach((op, index) => {
        console.log(`${index + 1}. ID: ${op.id}`);
        console.log(`   Símbolo: ${op.symbol}`);
        console.log(`   Lucro USD: ${op.profitLossUsd}`);
        console.log(`   Lucro %: ${op.profitLossPercent}`);
        console.log(`   Data: ${op.finalizedAt}`);
        console.log(`   Exchanges: ${op.spotExchange} / ${op.futuresExchange}`);
        console.log('');
      });
      
    } else {
      console.log('⚠️ Nenhuma operação encontrada no banco de produção');
      
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
    console.error('❌ Erro ao conectar com banco de produção:', error.message);
    console.error('❌ Stack trace:', error.stack);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('🔌 Conexão com banco fechada');
    }
  }
}

testProductionDB().catch(console.error); 