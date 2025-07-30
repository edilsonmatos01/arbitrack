require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');

console.log('🔍 Verificando estrutura da tabela SpreadHistory...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

async function checkTableStructure() {
  try {
    console.log('🔄 Tentando conectar...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar estrutura da tabela
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'SpreadHistory'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura da tabela SpreadHistory:');
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });
    
    // Verificar se há sequência para o ID
    const sequence = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_name LIKE '%spread_history%'
    `);
    
    console.log('📋 Sequências encontradas:', sequence.rows.map(r => r.sequence_name));
    
    // Verificar total de registros
    const count = await client.query('SELECT COUNT(*) as total FROM "SpreadHistory"');
    console.log(`📊 Total de registros na tabela: ${count.rows[0].total}`);
    
    client.release();
    await pool.end();
    console.log('✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    console.error('📋 Código do erro:', error.code);
    await pool.end();
  }
}

checkTableStructure(); 