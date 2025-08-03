const { Pool } = require('pg');

console.log('🔍 VERIFICANDO SÍMBOLOS NO BANCO');
console.log('=================================');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkSymbols() {
  try {
    console.log('✅ Conectado ao banco');
    
    // Verificar símbolos únicos
    const result = await pool.query(`
      SELECT DISTINCT symbol, COUNT(*) as count
      FROM "SpreadHistory" 
      GROUP BY symbol 
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log(`\n📈 TOP 10 SÍMBOLOS (${result.rows.length}):`);
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol} - ${row.count} registros`);
    });
    
    // Verificar registros mais recentes
    const recentResult = await pool.query(`
      SELECT symbol, spread, timestamp 
      FROM "SpreadHistory" 
      ORDER BY timestamp DESC 
      LIMIT 5
    `);
    
    console.log(`\n🕒 REGISTROS MAIS RECENTES:`);
    recentResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol} - Spread: ${row.spread}% - ${row.timestamp}`);
    });
    
    // Verificar se há dados das últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM "SpreadHistory" 
      WHERE timestamp >= $1
    `, [twentyFourHoursAgo]);
    
    console.log(`\n📊 Registros das últimas 24 horas: ${recentCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada');
  }
}

checkSymbols(); 