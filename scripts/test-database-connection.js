require('dotenv').config();
// Script para testar conexão com banco de dados no Render
const { Pool } = require('pg');

// URL do banco no Render
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

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

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com banco de dados...');
  console.log('🌐 DATABASE_URL:', DATABASE_URL ? 'Definida' : 'Não definida');
  
  try {
    // Teste 1: Conexão básica
    console.log('\n1️⃣ Testando conexão básica...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste 2: Verificar tabelas
    console.log('\n2️⃣ Verificando tabelas...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Tabelas encontradas:', tablesResult.rows.map(row => row.table_name));
    
    // Teste 3: Verificar dados em cada tabela
    console.log('\n3️⃣ Verificando dados nas tabelas...');
    
    // OperationHistory
    const operationCount = await client.query('SELECT COUNT(*) as count FROM "OperationHistory"');
    console.log(`📊 OperationHistory: ${operationCount.rows[0].count} registros`);
    
    if (parseInt(operationCount.rows[0].count) > 0) {
      const operations = await client.query('SELECT * FROM "OperationHistory" ORDER BY "createdAt" DESC LIMIT 3');
      console.log('📝 Últimas operações:');
      operations.rows.forEach((op, index) => {
        console.log(`   ${index + 1}. ${op.symbol} - $${op.profitLossUsd} (${op.profitLossPercent}%)`);
      });
    }
    
    // SpreadHistory
    const spreadCount = await client.query('SELECT COUNT(*) as count FROM "SpreadHistory"');
    console.log(`📊 SpreadHistory: ${spreadCount.rows[0].count} registros`);
    
    if (parseInt(spreadCount.rows[0].count) > 0) {
      const spreads = await client.query('SELECT * FROM "SpreadHistory" ORDER BY timestamp DESC LIMIT 3');
      console.log('📝 Últimos spreads:');
      spreads.rows.forEach((spread, index) => {
        console.log(`   ${index + 1}. ${spread.symbol} - ${spread.spread}%`);
      });
    }
    
    // ManualBalance
    const balanceCount = await client.query('SELECT COUNT(*) as count FROM "ManualBalance"');
    console.log(`📊 ManualBalance: ${balanceCount.rows[0].count} registros`);
    
    if (parseInt(balanceCount.rows[0].count) > 0) {
      const balances = await client.query('SELECT * FROM "ManualBalance" ORDER BY "createdAt" DESC LIMIT 3');
      console.log('📝 Últimos saldos:');
      balances.rows.forEach((balance, index) => {
        console.log(`   ${index + 1}. ${balance.exchange} - $${balance.balance}`);
      });
    }
    
    // Position
    const positionCount = await client.query('SELECT COUNT(*) as count FROM "Position"');
    console.log(`📊 Position: ${positionCount.rows[0].count} registros`);
    
    if (parseInt(positionCount.rows[0].count) > 0) {
      const positions = await client.query('SELECT * FROM "Position" ORDER BY "createdAt" DESC LIMIT 3');
      console.log('📝 Últimas posições:');
      positions.rows.forEach((position, index) => {
        console.log(`   ${index + 1}. ${position.symbol} - ${position.side} - $${position.quantity}`);
      });
    }
    
    client.release();
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('Detalhes:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  } finally {
    await pool.end();
  }
}

// Executar teste
testDatabaseConnection().catch(console.error); 