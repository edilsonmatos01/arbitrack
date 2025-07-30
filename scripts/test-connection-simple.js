// Script simples para testar conexão com banco
const { Client } = require('pg');

const connectionString = "postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8";

console.log('=== TESTE DE CONEXÃO SIMPLES ===');
console.log('Data/Hora:', new Date().toISOString());
console.log('');

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Tentando conectar...');
    await client.connect();
    console.log('✅ Conexão estabelecida!');
    
    console.log('Testando consulta simples...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Consulta executada com sucesso!');
    console.log('Hora atual:', result.rows[0].current_time);
    console.log('Versão PostgreSQL:', result.rows[0].pg_version.split(' ')[0]);
    
    console.log('');
    console.log('Testando tabelas...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tabelas encontradas:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    if (tables.rows.length > 0) {
      console.log('');
      console.log('Testando contagem de registros...');
      const countResult = await client.query('SELECT COUNT(*) as total FROM "SpreadHistory"');
      console.log(`Total de registros em SpreadHistory: ${countResult.rows[0].total}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
  } finally {
    await client.end();
  }
}

testConnection(); 