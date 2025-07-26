require('dotenv').config();

console.log('🔍 Teste direto com pg...');
console.log('');

const { Pool } = require('pg');

async function testPgDirect() {
  console.log('🔧 Criando pool de conexão pg...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('✅ Pool criado');
    console.log('🔌 Tentando conectar...');
    
    // Teste simples de conexão
    const result = await pool.query('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Resultado:', result.rows[0]);
    
    // Testar tabelas
    console.log('📋 Verificando tabelas...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📊 Tabelas encontradas:', tables.rows.length);
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Testar operações específicas
    console.log('📋 Testando operações específicas...');
    
    // Testar SpreadHistory
    const spreadCount = await pool.query('SELECT COUNT(*) as count FROM "SpreadHistory"');
    console.log(`  - SpreadHistory: ${spreadCount.rows[0].count} registros`);
    
    // Testar OperationHistory
    const operationCount = await pool.query('SELECT COUNT(*) as count FROM "OperationHistory"');
    console.log(`  - OperationHistory: ${operationCount.rows[0].count} registros`);
    
    // Testar ManualBalance
    const balanceCount = await pool.query('SELECT COUNT(*) as count FROM "ManualBalance"');
    console.log(`  - ManualBalance: ${balanceCount.rows[0].count} registros`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('🔍 Código:', error.code);
  } finally {
    await pool.end();
    console.log('🔌 Conexão fechada');
  }
}

testPgDirect(); 