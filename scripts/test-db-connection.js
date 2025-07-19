const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testando conexão com o banco...');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('📡 Conectando...');
    await prisma.$connect();
    console.log('✅ Conectado!');
    
    // Testar uma query simples
    console.log('📊 Testando query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query funcionou:', result);
    
    // Verificar se a tabela existe
    console.log('📋 Verificando tabela SpreadHistory...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SpreadHistory'
      );
    `;
    console.log('✅ Tabela existe:', tableExists[0].exists);
    
    if (tableExists[0].exists) {
      const count = await prisma.spreadHistory.count();
      console.log(`📊 Total de registros: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Desconectado');
  }
}

testConnection(); 