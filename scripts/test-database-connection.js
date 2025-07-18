require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão direta com o banco de dados...');
  console.log('');
  
  // Mostrar URL (mascarada)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('📊 DATABASE_URL (mascarada):', maskedUrl);
  } else {
    console.log('❌ DATABASE_URL não definida');
    return;
  }
  
  console.log('');
  
  let prisma;
  try {
    console.log('🔧 Usando Prisma Client compartilhado...');
    prisma = require('../lib/prisma').default;
    
    console.log('✅ Prisma Client criado');
    console.log('');
    
    console.log('🔌 Tentando conectar...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('');
    
    console.log('📋 Testando consulta simples...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Consulta executada:', result);
    console.log('');
    
    console.log('📊 Verificando tabelas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Tabelas encontradas:', tables.length);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('🔍 Detalhes:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('');
      console.log('🔌 Conexão fechada');
    }
  }
}

testDatabaseConnection().catch(console.error); 