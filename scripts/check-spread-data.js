"use strict";
const { Pool } = require('pg');

console.log('🔍 VERIFICANDO DADOS DE SPREAD NO BANCO');
console.log('========================================');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkSpreadData() {
  try {
    console.log('✅ Conectado ao banco');
    
    // Verificar total de registros
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM "SpreadHistory"');
    console.log(`📊 Total de registros: ${totalResult.rows[0].total.toLocaleString()}`);
    
    // Verificar registros das últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentResult = await pool.query(`
      SELECT COUNT(*) as count FROM "SpreadHistory" 
      WHERE timestamp >= $1
    `, [twentyFourHoursAgo]);
    console.log(`📈 Registros das últimas 24h: ${recentResult.rows[0].count.toLocaleString()}`);
    
    // Verificar spreads com valores altos (oportunidades)
    const highSpreadsResult = await pool.query(`
      SELECT symbol, spread, timestamp 
      FROM "SpreadHistory" 
      WHERE spread >= 0.1
      ORDER BY spread DESC 
      LIMIT 10
    `);
    
    console.log(`\n🎯 SPREADS ALTOS (>= 0.1%): ${highSpreadsResult.rows.length}`);
    highSpreadsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol} - ${row.spread.toFixed(4)}% - ${row.timestamp}`);
    });
    
    // Verificar spreads recentes com valores altos
    const recentHighSpreadsResult = await pool.query(`
      SELECT symbol, spread, timestamp 
      FROM "SpreadHistory" 
      WHERE spread >= 0.1 AND timestamp >= $1
      ORDER BY timestamp DESC 
      LIMIT 5
    `, [twentyFourHoursAgo]);
    
    console.log(`\n🕒 SPREADS ALTOS RECENTES (24h): ${recentHighSpreadsResult.rows.length}`);
    recentHighSpreadsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol} - ${row.spread.toFixed(4)}% - ${row.timestamp}`);
    });
    
    // Verificar símbolos mais ativos
    const activeSymbolsResult = await pool.query(`
      SELECT symbol, COUNT(*) as count, AVG(spread) as avg_spread, MAX(spread) as max_spread
      FROM "SpreadHistory" 
      WHERE timestamp >= $1
      GROUP BY symbol 
      ORDER BY count DESC 
      LIMIT 10
    `, [twentyFourHoursAgo]);
    
    console.log(`\n📊 SÍMBOLOS MAIS ATIVOS (24h):`);
    activeSymbolsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol} - ${row.count} registros - Média: ${row.avg_spread.toFixed(4)}% - Máx: ${row.max_spread.toFixed(4)}%`);
    });
    
    // Verificar se há dados suficientes para arbitragem
    if (recentHighSpreadsResult.rows.length > 0) {
      console.log(`\n✅ SUCESSO: Há ${recentHighSpreadsResult.rows.length} oportunidades recentes!`);
    } else {
      console.log(`\n⚠️  PROBLEMA: Nenhuma oportunidade recente encontrada`);
      console.log(`   - Verificar se o worker está salvando dados`);
      console.log(`   - Verificar se há spreads >= 0.1%`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada');
  }
}

checkSpreadData();
