require('dotenv').config();

console.log('🔍 Diagnóstico específico do Render...');
console.log('');

const { Pool } = require('pg');

// Teste de diagnóstico
async function diagnoseRender() {
  console.log('=== DIAGNÓSTICO RENDER ===');
  
  // 1. Verificar URL
  const url = process.env.DATABASE_URL;
  console.log('1. URL do banco:', url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  // 2. Extrair componentes da URL
  const urlMatch = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (urlMatch) {
    const [, user, password, host, port, database] = urlMatch;
    console.log('2. Componentes da URL:');
    console.log(`   - Host: ${host}`);
    console.log(`   - Port: ${port}`);
    console.log(`   - Database: ${database}`);
    console.log(`   - User: ${user}`);
  }
  
  // 3. Teste de conectividade básica
  console.log('3. Teste de conectividade básica...');
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000
  });
  
  try {
    console.log('   🔌 Tentando conectar...');
    const client = await pool.connect();
    console.log('   ✅ Conexão básica OK!');
    
    // 4. Teste de autenticação
    console.log('4. Teste de autenticação...');
    const authResult = await client.query('SELECT current_user, current_database()');
    console.log('   ✅ Autenticação OK!');
    console.log(`   - Usuário: ${authResult.rows[0].current_user}`);
    console.log(`   - Database: ${authResult.rows[0].current_database}`);
    
    // 5. Teste de permissões
    console.log('5. Teste de permissões...');
    const permResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 3
    `);
    console.log('   ✅ Permissões OK!');
    console.log(`   - Tabelas encontradas: ${permResult.rows.length}`);
    
    // 6. Teste de operações específicas
    console.log('6. Teste de operações específicas...');
    
    // Teste SpreadHistory
    const spreadCount = await client.query('SELECT COUNT(*) as count FROM "SpreadHistory"');
    console.log(`   - SpreadHistory: ${spreadCount.rows[0].count} registros`);
    
    // Teste OperationHistory
    const operationCount = await client.query('SELECT COUNT(*) as count FROM "OperationHistory"');
    console.log(`   - OperationHistory: ${operationCount.rows[0].count} registros`);
    
    // Teste ManualBalance
    const balanceCount = await client.query('SELECT COUNT(*) as count FROM "ManualBalance"');
    console.log(`   - ManualBalance: ${balanceCount.rows[0].count} registros`);
    
    console.log('🎉 DIAGNÓSTICO COMPLETO - TUDO OK!');
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.log('   ❌ FALHOU:', error.message);
    if (error.code) console.log('   🔍 Código:', error.code);
    
    // Análise do erro
    console.log('7. Análise do erro:');
    if (error.code === 'ECONNREFUSED') {
      console.log('   - Problema: Conexão recusada (servidor não está rodando)');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   - Problema: Timeout de conexão (firewall/proxy)');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   - Problema: Host não encontrado (DNS)');
    } else if (error.message.includes('authentication')) {
      console.log('   - Problema: Falha de autenticação (credenciais)');
    } else if (error.message.includes('permission')) {
      console.log('   - Problema: Falta de permissões');
    } else {
      console.log('   - Problema: Erro desconhecido');
    }
    
    await pool.end();
    return false;
  }
}

diagnoseRender(); 