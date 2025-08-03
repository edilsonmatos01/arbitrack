require('dotenv').config();

console.log('🔍 Testando modificações na URL do banco...');
console.log('');

const { Pool } = require('pg');

// URL original
const originalUrl = process.env.DATABASE_URL;
console.log('URL Original:', originalUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

// Modificações na URL
const urlModifications = [
  {
    name: 'URL Original',
    url: originalUrl
  },
  {
    name: 'URL com sslmode=require',
    url: originalUrl + '?sslmode=require'
  },
  {
    name: 'URL com sslmode=prefer',
    url: originalUrl + '?sslmode=prefer'
  },
  {
    name: 'URL com sslmode=disable',
    url: originalUrl + '?sslmode=disable'
  },
  {
    name: 'URL com connect_timeout=60',
    url: originalUrl + '?connect_timeout=60'
  },
  {
    name: 'URL com múltiplos parâmetros',
    url: originalUrl + '?sslmode=require&connect_timeout=60&application_name=arbitragem'
  }
];

async function testUrl(url, name) {
  console.log(`=== TESTE: ${name} ===`);
  console.log('URL:', url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000
  });
  
  try {
    console.log('🔌 Tentando conectar...');
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ SUCESSO!');
    console.log('📊 Resultado:', result.rows[0]);
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ FALHOU:', error.message);
    if (error.code) console.log('🔍 Código:', error.code);
    await pool.end();
    return false;
  }
}

async function runTests() {
  console.log('🔧 Testando modificações na URL...');
  console.log('');
  
  const results = [];
  
  for (const modification of urlModifications) {
    results.push(await testUrl(modification.url, modification.name));
    console.log(''); // Espaço entre testes
  }
  
  console.log('📊 RESUMO:');
  results.forEach((result, index) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${urlModifications[index].name}`);
  });
}

runTests(); 