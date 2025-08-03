const { Client } = require('pg');

console.log('🔍 VERIFICANDO SÍMBOLOS NO BANCO DE DADOS');
console.log('==========================================');

async function checkDatabaseSymbols() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar símbolos únicos nas últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log(`\n📊 Buscando símbolos das últimas 24 horas (desde ${twentyFourHoursAgo.toISOString()})...`);
    
    const result = await client.query(`
      SELECT DISTINCT symbol, COUNT(*) as count, 
             MAX(timestamp) as latest_timestamp,
             MIN(timestamp) as earliest_timestamp
      FROM "SpreadHistory" 
      WHERE timestamp >= $1
      GROUP BY symbol 
      ORDER BY count DESC
      LIMIT 20
    `, [twentyFourHoursAgo]);

    console.log(`\n📈 SÍMBOLOS ENCONTRADOS (${result.rows.length}):`);
    console.log('=====================================');
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum símbolo encontrado nas últimas 24 horas');
      
      // Verificar símbolos mais antigos
      console.log('\n🔍 Verificando símbolos mais antigos...');
      const oldResult = await client.query(`
        SELECT DISTINCT symbol, COUNT(*) as count, 
               MAX(timestamp) as latest_timestamp
        FROM "SpreadHistory" 
        GROUP BY symbol 
        ORDER BY latest_timestamp DESC
        LIMIT 10
      `);
      
      console.log(`\n📈 SÍMBOLOS MAIS RECENTES (${oldResult.rows.length}):`);
      oldResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.symbol} - ${row.count} registros - Último: ${row.latest_timestamp}`);
      });
      
    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.symbol} - ${row.count} registros - Último: ${row.latest_timestamp}`);
      });
    }

    // Verificar total de registros
    const totalResult = await client.query('SELECT COUNT(*) as total FROM "SpreadHistory"');
    console.log(`\n📊 Total de registros no banco: ${totalResult.rows[0].total.toLocaleString()}`);

    // Verificar registros mais recentes
    const recentResult = await client.query(`
      SELECT symbol, spread, timestamp 
      FROM "SpreadHistory" 
      ORDER BY timestamp DESC 
      LIMIT 5
    `);

    console.log(`\n🕒 REGISTROS MAIS RECENTES:`);
    recentResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol} - Spread: ${row.spread}% - ${row.timestamp}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada');
  }
}

checkDatabaseSymbols(); 