require('dotenv').config();

console.log('🔍 Teste de conectividade específica do Render...');
console.log('');

const { Pool } = require('pg');

// Configurações específicas para Render
const renderConfigs = [
  {
    name: 'Render - Configuração Padrão',
    config: {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 30000,
      query_timeout: 30000
    }
  },
  {
    name: 'Render - SSL Require',
    config: {
      connectionString: process.env.DATABASE_URL + '?sslmode=require',
      connectionTimeoutMillis: 30000,
      query_timeout: 30000
    }
  },
  {
    name: 'Render - SSL Prefer',
    config: {
      connectionString: process.env.DATABASE_URL + '?sslmode=prefer',
      connectionTimeoutMillis: 30000,
      query_timeout: 30000
    }
  },
  {
    name: 'Render - Sem SSL',
    config: {
      connectionString: process.env.DATABASE_URL + '?sslmode=disable',
      connectionTimeoutMillis: 30000,
      query_timeout: 30000
    }
  }
];

async function testRenderConnection(config, name) {
  console.log(`=== TESTE: ${name} ===`);
  console.log('URL:', config.connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  const pool = new Pool(config);
  
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
      LIMIT 5
    `);
    console.log('✅ Tabelas consultadas!');
    console.log('📊 Tabelas encontradas:', tables.rows.length);
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ FALHOU:', error.message);
    if (error.code) console.log('🔍 Código:', error.code);
    await pool.end();
    return false;
  }
}

async function runRenderConnectionTests() {
  console.log('🔧 Testando conectividade específica do Render...');
  console.log('');
  
  const results = [];
  
  for (const config of renderConfigs) {
    results.push(await testRenderConnection(config.config, config.name));
    console.log(''); // Espaço entre testes
  }
  
  console.log('📊 RESUMO:');
  results.forEach((result, index) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${renderConfigs[index].name}`);
  });
}

runRenderConnectionTests(); 