const { Pool } = require('pg');

// URL do banco da Render (baseada no render.yaml)
// Vamos tentar diferentes possibilidades
const possibleUrls = [
  // URL que estava funcionando localmente
  'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8',
  
  // URL baseada no render.yaml (pode ser diferente)
  'postgresql://arbitragem_banco_user:password@dpg-xxx-oregon-postgres.render.com/arbitragem_banco'
];

async function testDatabaseConnection(url, description) {
  console.log(`\n🔍 Testando: ${description}`);
  console.log(`🌐 URL (mascarada): ${url.substring(0, 50)}...`);
  
  const pool = new Pool({
    connectionString: url + '?sslmode=require&connect_timeout=60&application_name=arbitragem',
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

  try {
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida');
    
    // Verificar tabelas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas:', tablesResult.rows.map(r => r.table_name));
    
    // Verificar OperationHistory
    if (tablesResult.rows.some(r => r.table_name === 'OperationHistory')) {
      const countResult = await client.query('SELECT COUNT(*) as count FROM "OperationHistory"');
      const totalCount = parseInt(countResult.rows[0].count);
      console.log(`📊 Total de operações: ${totalCount}`);
      
      if (totalCount > 0) {
        const operationsResult = await client.query(`
          SELECT * FROM "OperationHistory" 
          ORDER BY "createdAt" DESC 
          LIMIT 3
        `);
        
        console.log('📝 Operações encontradas:');
        operationsResult.rows.forEach((op, index) => {
          console.log(`   ${index + 1}. ID: ${op.id}, Symbol: ${op.symbol}, Profit: ${op.profitLossUsd}`);
        });
      }
    } else {
      console.log('❌ Tabela OperationHistory não encontrada');
    }
    
    client.release();
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  } finally {
    await pool.end();
  }
}

async function testAllDatabases() {
  console.log('🔍 Testando diferentes configurações de banco...');
  
  for (let i = 0; i < possibleUrls.length; i++) {
    await testDatabaseConnection(possibleUrls[i], `Configuração ${i + 1}`);
  }
}

testAllDatabases(); 