require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');

console.log('🔍 Testando conectividade básica com o banco na porta 5432...');
console.log('URL do banco:', process.env.DATABASE_URL ? '✅ Definida' : '❌ Não definida');

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL não está definida');
  process.exit(1);
}

// Extrair informações da URL para debug
const url = new URL(process.env.DATABASE_URL);
console.log('📋 Host:', url.hostname);
console.log('📋 Porta:', url.port || '5432 (padrão)');
console.log('📋 Usuário:', url.username);
console.log('📋 Banco:', url.pathname.substring(1));

// Tentar conectar com configurações diferentes
const configs = [
  {
    name: 'Configuração 1 - URL completa',
    config: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    }
  },
  {
    name: 'Configuração 2 - Parâmetros separados',
    config: {
      host: url.hostname,
      port: url.port || 5432,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    }
  }
];

async function testConnection(config, configName) {
  console.log(`\n🔄 Testando ${configName}...`);
  
  const pool = new Pool(config);
  
  try {
    console.log('🔄 Tentando conectar...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Hora atual do servidor:', result.rows[0].current_time);
    
    client.release();
    await pool.end();
    console.log('✅ Teste concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('📋 Código do erro:', error.code);
    await pool.end();
    return false;
  }
}

async function runTests() {
  for (const config of configs) {
    const success = await testConnection(config.config, config.name);
    if (success) {
      console.log('✅ Uma configuração funcionou!');
      return;
    }
  }
  console.log('❌ Nenhuma configuração funcionou');
}

runTests(); 
testConnection(); 