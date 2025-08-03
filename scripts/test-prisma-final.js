require('dotenv').config();

console.log('🔍 Teste final do Prisma...');
console.log('');

const { PrismaClient } = require('@prisma/client');

// Configuração final específica para Render
const finalConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?sslmode=require&connect_timeout=60'
    }
  },
  log: ['error', 'warn']
};

async function testFinal() {
  console.log('=== TESTE FINAL ===');
  console.log('🔧 Criando Prisma Client com configuração final...');
  console.log('URL:', finalConfig.datasources.db.url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  const prisma = new PrismaClient(finalConfig);
  
  try {
    console.log('✅ Prisma Client criado');
    console.log('🔌 Tentando conectar...');
    
    // Teste simples
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ CONEXÃO BEM-SUCEDIDA!');
    console.log('📊 Resultado:', result[0]);
    
    // Teste de tabelas
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
    
    // Teste de dados
    console.log('📊 Testando dados...');
    const spreadCount = await prisma.spreadHistory.count();
    console.log(`  - SpreadHistory: ${spreadCount} registros`);
    
    const operationCount = await prisma.operationHistory.count();
    console.log(`  - OperationHistory: ${operationCount} registros`);
    
    const balanceCount = await prisma.manualBalance.count();
    console.log(`  - ManualBalance: ${balanceCount} registros`);
    
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('🔍 Código:', error.code);
    await prisma.$disconnect();
    return false;
  }
}

testFinal(); 