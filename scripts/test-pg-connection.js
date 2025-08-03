import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

console.log('🔍 Testando conexão com PostgreSQL usando pg...');
console.log('');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('❌ DATABASE_URL não definida');
  process.exit(1);
}

console.log('📊 URL (mascarada):', dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
console.log('');

async function testConnection() {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Tentando conectar...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    console.log('📋 Testando consulta simples...');
    const result = await client.query('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Consulta executada:', result.rows[0]);
    
    console.log('📊 Verificando tabelas...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Tabelas encontradas:', tables.rows.length);
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('🔍 Detalhes:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

testConnection(); 