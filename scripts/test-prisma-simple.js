require('dotenv').config();

console.log('🔍 Teste simples do Prisma...');
console.log('');

const { PrismaClient } = require('@prisma/client');

async function testSimple() {
  console.log('🔧 Criando Prisma Client simples...');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  
  try {
    console.log('✅ Prisma Client criado');
    console.log('🔌 Tentando conectar...');
    
    // Teste simples de conexão
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('🔍 Código:', error.code);
    console.error('🔍 Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão fechada');
  }
}

testSimple(); 