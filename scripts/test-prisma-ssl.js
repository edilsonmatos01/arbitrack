require('dotenv').config();

console.log('🔍 Teste do Prisma com SSL...');
console.log('');

const { PrismaClient } = require('@prisma/client');

async function testWithSSL() {
  console.log('🔧 Criando Prisma Client com SSL...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?sslmode=require',
      },
    },
  });
  
  try {
    console.log('✅ Prisma Client criado');
    console.log('🔌 Tentando conectar...');
    
    // Teste simples de conexão
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Resultado:', result[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('🔍 Código:', error.code);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão fechada');
  }
}

testWithSSL(); 