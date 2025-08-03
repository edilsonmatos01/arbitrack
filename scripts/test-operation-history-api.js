const { Pool } = require('pg');

// URL correta do banco fornecida pelo usuário
const DATABASE_URL = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

// Configuração do banco
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

async function testOperationHistory() {
  console.log('🔍 Testando API de Histórico de Operações...');
  
  try {
    // 1. Testar conexão com o banco
    console.log('\n1️⃣ Testando conexão com o banco...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida');
    
    // 2. Verificar se a tabela existe
    console.log('\n2️⃣ Verificando estrutura da tabela...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'OperationHistory'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela OperationHistory existe');
    } else {
      console.log('❌ Tabela OperationHistory não existe');
      client.release();
      return;
    }
    
    // 3. Contar registros
    console.log('\n3️⃣ Contando registros...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM "OperationHistory"');
    const totalCount = parseInt(countResult.rows[0].count);
    console.log(`📊 Total de operações: ${totalCount}`);
    
    // 4. Buscar operações
    console.log('\n4️⃣ Buscando operações...');
    const operationsResult = await client.query(`
      SELECT * FROM "OperationHistory" 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `);
    
    console.log(`📋 Operações encontradas: ${operationsResult.rows.length}`);
    
    if (operationsResult.rows.length > 0) {
      console.log('\n📝 Primeira operação:');
      const firstOp = operationsResult.rows[0];
      console.log(`   ID: ${firstOp.id}`);
      console.log(`   Symbol: ${firstOp.symbol}`);
      console.log(`   Profit/Loss USD: ${firstOp.profitLossUsd}`);
      console.log(`   Profit/Loss %: ${firstOp.profitLossPercent}`);
      console.log(`   Created: ${firstOp.createdAt}`);
      console.log(`   Finalized: ${firstOp.finalizedAt}`);
    }
    
    // 5. Testar API endpoint
    console.log('\n5️⃣ Testando endpoint da API...');
    try {
      const response = await fetch('http://localhost:3000/api/operation-history?filter=all');
      if (response.ok) {
        const apiData = await response.json();
        console.log(`✅ API retornou ${apiData.length} operações`);
        
        if (apiData.length > 0) {
          console.log('📝 Primeira operação da API:');
          console.log(`   ID: ${apiData[0].id}`);
          console.log(`   Symbol: ${apiData[0].symbol}`);
          console.log(`   Profit/Loss USD: ${apiData[0].profitLossUsd}`);
        }
      } else {
        console.log(`❌ API retornou status ${response.status}`);
      }
    } catch (apiError) {
      console.log('❌ Erro ao testar API:', apiError.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await pool.end();
  }
}

// Verificar variáveis de ambiente
console.log('🌐 Variáveis de ambiente:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definida' : '❌ Não definida');
if (process.env.DATABASE_URL) {
  console.log('  URL (mascarada):', process.env.DATABASE_URL.substring(0, 50) + '...');
}
console.log('- Usando URL hardcoded para teste');

testOperationHistory(); 