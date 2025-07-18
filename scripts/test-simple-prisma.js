require('dotenv').config();

console.log('🔍 Teste simples do Prisma...');
console.log('');

const { PrismaClient } = require('@prisma/client');

async function testSimple() {
  console.log('🔧 Criando Prisma Client simples...');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('✅ Prisma Client criado');
    console.log('🔌 Tentando conectar...');
    
    // Teste simples de conexão
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Resultado:', result[0]);
    
    // Testar tabelas
    console.log('📋 Verificando tabelas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📊 Tabelas encontradas:', tables.length);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('🔍 Código:', error.code);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão fechada');
  }
}

testSimple(); 