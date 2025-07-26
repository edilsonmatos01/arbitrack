require('dotenv').config();

console.log('🔍 Teste final com pg diretamente...');
console.log('');

const { Pool } = require('pg');

// Configuração específica para Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL + '?sslmode=require&connect_timeout=60&application_name=arbitragem',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 60000,
  query_timeout: 60000,
  statement_timeout: 60000,
  idleTimeoutMillis: 30000,
  max: 5,
  min: 1
});

async function testPgDirect() {
  console.log('=== TESTE: PG Direto Final ===');
  
  try {
    console.log('🔌 Tentando conectar...');
    
    // Teste de conexão básica
    const client = await pool.connect();
    console.log('✅ Cliente conectado!');
    
    // Teste de query simples
    const result = await client.query('SELECT 1 as test, NOW() as current_time, version() as pg_version');
    console.log('✅ Query executada!');
    console.log('📊 Resultado:', result.rows[0]);
    
    // Teste de tabelas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('✅ Tabelas consultadas!');
    console.log('📊 Tabelas encontradas:', tables.rows.length);
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Teste de dados específicos
    console.log('📊 Testando dados específicos...');
    
    // SpreadHistory
    const spreadCount = await client.query('SELECT COUNT(*) as count FROM "SpreadHistory"');
    console.log(`  - SpreadHistory: ${spreadCount.rows[0].count} registros`);
    
    // OperationHistory
    const operationCount = await client.query('SELECT COUNT(*) as count FROM "OperationHistory"');
    console.log(`  - OperationHistory: ${operationCount.rows[0].count} registros`);
    
    // ManualBalance
    const balanceCount = await client.query('SELECT COUNT(*) as count FROM "ManualBalance"');
    console.log(`  - ManualBalance: ${balanceCount.rows[0].count} registros`);
    
    // Position
    const positionCount = await client.query('SELECT COUNT(*) as count FROM "Position"');
    console.log(`  - Position: ${positionCount.rows[0].count} registros`);
    
    // Teste de busca de dados
    const operations = await client.query(`
      SELECT * FROM "OperationHistory" 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    console.log(`  - Últimas 5 operações: ${operations.rows.length} encontradas`);
    
    const balances = await client.query(`
      SELECT * FROM "ManualBalance" 
      ORDER BY "createdAt" DESC
    `);
    console.log(`  - Balanços manuais: ${balances.rows.length} encontrados`);
    
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code) console.error('🔍 Código:', error.code);
    await pool.end();
    return false;
  }
}

testPgDirect(); 