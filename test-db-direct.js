const { Pool } = require('pg');

// URL correta do banco fornecida pelo usuário
const DATABASE_URL = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

// Configuração específica para Render
const pool = new Pool({
  connectionString: DATABASE_URL + '?sslmode=require&connect_timeout=60&application_name=arbitragem',
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

async function testDirectConnection() {
  console.log('🔍 Testando conexão direta com pg...');
  console.log('🌐 URL:', DATABASE_URL ? 'Configurada' : 'Não configurada');
  
  try {
    const client = await pool.connect();
    console.log('✅ Cliente conectado!');
    
    try {
      // Teste simples
      const result = await client.query('SELECT 1 as test, NOW() as current_time');
      console.log('✅ Query simples funcionando!');
      console.log('📊 Resultado:', result.rows);
      
      // Teste de contagem
      const countResult = await client.query('SELECT COUNT(*) as total FROM "SpreadHistory"');
      console.log('📈 Total de registros na SpreadHistory:', countResult.rows[0]?.total);
      
      // Teste de dados recentes
      const recentData = await client.query(`
        SELECT symbol, spread, timestamp 
        FROM "SpreadHistory" 
        ORDER BY timestamp DESC 
        LIMIT 5
      `);
      console.log('🕒 Dados mais recentes:', recentData.rows);
      
    } finally {
      client.release();
      console.log('🔓 Cliente liberado');
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão direta:', error.message);
    console.error('🔍 Código do erro:', error.code);
    console.error('🔍 Detalhes:', error);
  } finally {
    await pool.end();
    console.log('🏁 Pool fechado');
  }
}

testDirectConnection(); 