require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function checkSpreadData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando dados de SpreadHistory...');
    
    // Verificar se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SpreadHistory'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Tabela SpreadHistory não existe');
      return;
    }
    
    console.log('✅ Tabela SpreadHistory existe');
    
    // Contar total de registros
    const totalCount = await client.query('SELECT COUNT(*) FROM "SpreadHistory"');
    console.log(`📊 Total de registros: ${totalCount.rows[0].count}`);
    
    // Verificar registros das últimas 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await client.query(`
      SELECT COUNT(*) FROM "SpreadHistory" 
      WHERE "timestamp" >= $1
    `, [twentyFourHoursAgo]);
    
    console.log(`📊 Registros das últimas 24h: ${recentCount.rows[0].count}`);
    
    // Verificar símbolos únicos
    const uniqueSymbols = await client.query('SELECT DISTINCT symbol FROM "SpreadHistory" LIMIT 10');
    console.log('📋 Símbolos únicos (primeiros 10):', uniqueSymbols.rows.map(r => r.symbol));
    
    // Verificar spreads máximos por símbolo nas últimas 24h
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
    
    // Verificar últimos registros
    const lastRecords = await client.query(`
      SELECT symbol, spread, "timestamp"
      FROM "SpreadHistory" 
      ORDER BY "timestamp" DESC
      LIMIT 5
    `);
    
    console.log('🕒 Últimos registros:');
    lastRecords.rows.forEach(row => {
      console.log(`  ${row.symbol}: ${row.spread}% em ${row.timestamp}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSpreadData(); 