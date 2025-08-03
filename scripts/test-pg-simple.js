require('dotenv').config();

console.log('🔍 Teste simples com pg...');
console.log('');

const { Pool } = require('pg');

async function testPgSimple() {
  console.log('🔧 Criando pool...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000, // 10 segundos
    query_timeout: 10000
  });
  
  try {
    console.log('✅ Pool criado');
    console.log('🔌 Conectando...');
    
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ Conexão OK!');
    console.log('📊 Resultado:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Fechado');
  }
}

testPgSimple(); 