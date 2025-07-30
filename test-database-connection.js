const { PrismaClient } = require('@prisma/client');

console.log('🔍 Testando conexão com banco de dados...');
console.log('📋 Variáveis de ambiente:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definida' : '❌ Não definida');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'Não definido');

async function testDatabaseConnection() {
  let prisma = null;
  
  try {
    console.log('\n🔄 Inicializando PrismaClient...');
    
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    console.log('✅ PrismaClient criado com sucesso');
    
    console.log('\n🔄 Testando conexão...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso');
    
    console.log('\n🔄 Testando query simples...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query executada com sucesso:', result);
    
    console.log('\n🔄 Testando tabela arbitrageOpportunity...');
    const count = await prisma.arbitrageOpportunity.count();
    console.log(`✅ Tabela arbitrageOpportunity acessível. Total de registros: ${count}`);
    
    console.log('\n✅ Todos os testes passaram!');
    
  } catch (error) {
    console.error('\n❌ Erro nos testes:', error);
    console.error('\n📋 Detalhes do erro:');
    console.error('- Nome:', error.name);
    console.error('- Mensagem:', error.message);
    console.error('- Stack:', error.stack);
    
    if (error.message.includes('Server has closed the connection')) {
      console.log('\n💡 SUGESTÃO: Problema de conexão com o banco. Verifique:');
      console.log('1. Se a DATABASE_URL está correta');
      console.log('2. Se o banco está acessível');
      console.log('3. Se as credenciais estão válidas');
    }
    
    if (error.message.includes('MODULE_NOT_FOUND')) {
      console.log('\n💡 SUGESTÃO: Problema com dependências. Execute:');
      console.log('npm install');
      console.log('npx prisma generate');
    }
    
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log('\n🔌 Prisma desconectado');
      } catch (e) {
        console.warn('\n⚠️ Erro ao desconectar Prisma:', e.message);
      }
    }
  }
}

// Executar teste
testDatabaseConnection().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 