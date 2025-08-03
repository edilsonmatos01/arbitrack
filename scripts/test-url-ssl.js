require('dotenv').config();

console.log('🔍 Testando diferentes configurações de URL...');
console.log('');

const { Pool } = require('pg');

const urls = [
  process.env.DATABASE_URL,
  process.env.DATABASE_URL + '?sslmode=require',
  process.env.DATABASE_URL + '?sslmode=prefer',
  process.env.DATABASE_URL + '?sslmode=disable'
];

async function testUrl(url, description) {
  console.log(`=== TESTE: ${description} ===`);
  console.log('URL:', url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000
  });
  
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ SUCESSO!');
    console.log('📊 Resultado:', result.rows[0]);
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ FALHOU:', error.message);
    await pool.end();
    return false;
  }
}

async function runTests() {
  const results = [];
  
  results.push(await testUrl(urls[0], 'URL Original'));
  results.push(await testUrl(urls[1], 'URL com sslmode=require'));
  results.push(await testUrl(urls[2], 'URL com sslmode=prefer'));
  results.push(await testUrl(urls[3], 'URL com sslmode=disable'));
  
  console.log('');
  console.log('📊 RESUMO:');
  results.forEach((result, index) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} Teste ${index + 1}`);
  });
}

runTests(); 