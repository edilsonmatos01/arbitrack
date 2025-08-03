require('dotenv').config();

console.log('🔍 Teste do Prisma com configuração robusta...');
console.log('');

// Importar a configuração robusta
const prisma = require('../lib/prisma').default;

async function testRobust() {
  try {
    console.log('✅ Prisma Client robusto criado');
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

testRobust(); 