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

async function checkSpreadData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando dados de SpreadHistory...');
    
    // Testar conexão
    const testResult = await client.query('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Conexão OK:', testResult.rows[0]);
    
    // Contar total de registros
    const totalCount = await client.query('SELECT COUNT(*) as count FROM "SpreadHistory"');
    console.log(`📊 Total de registros: ${totalCount.rows[0].count}`);
    
    // Buscar últimos registros
    const lastRecords = await client.query(`
      SELECT * FROM "SpreadHistory" 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    
    console.log('🕒 Últimos registros:');
    lastRecords.rows.forEach(record => {
      console.log(`  ${record.symbol}: ${record.spread}% em ${record.timestamp}`);
    });
    
    // Verificar spreads máximos por símbolo nas últimas 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const maxSpreads = await client.query(`
      SELECT symbol, MAX(spread) as max_spread, COUNT(*) as count
      FROM "SpreadHistory" 
      WHERE "timestamp" >= $1
      GROUP BY symbol
      ORDER BY max_spread DESC
      LIMIT 10
    `, [twentyFourHoursAgo]);
    
    console.log('📈 Spreads máximos das últimas 24h:');
    maxSpreads.rows.forEach(row => {
      console.log(`  ${row.symbol}: ${row.max_spread}% (${row.count} registros)`);
    });
    
    // Verificar símbolos únicos
    const uniqueSymbols = await client.query('SELECT DISTINCT symbol FROM "SpreadHistory" LIMIT 10');
    console.log('📋 Símbolos únicos (primeiros 10):', uniqueSymbols.rows.map(r => r.symbol));
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSpreadData(); 