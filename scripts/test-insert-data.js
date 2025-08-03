require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');

console.log('🔍 Testando inserção de dados no banco...');

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL não está definida');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

async function testInsert() {
  try {
    console.log('🔄 Tentando conectar...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar inserção de um registro de teste
    const testData = {
      symbol: 'TEST_BTC_USDT',
      exchangeBuy: 'TEST_EXCHANGE',
      exchangeSell: 'TEST_EXCHANGE_2',
      direction: 'spot_to_futures',
      spread: 0.5,
      spotPrice: 50000.0,
      futuresPrice: 50250.0,
    };
    
    console.log('📝 Inserindo dados de teste...');
    const result = await client.query(`
      INSERT INTO "SpreadHistory" (id, symbol, "exchangeBuy", "exchangeSell", direction, spread, "spotPrice", "futuresPrice", "timestamp")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING symbol, spread, "timestamp"
    `, [`test_${Date.now()}`, testData.symbol, testData.exchangeBuy, testData.exchangeSell, testData.direction, testData.spread, testData.spotPrice, testData.futuresPrice]);
    
    console.log('✅ Dados inseridos com sucesso!');
    console.log('📋 Registro inserido:', result.rows[0]);
    
    // Verificar se o registro foi inserido
    const checkResult = await client.query(`
      SELECT COUNT(*) as count FROM "SpreadHistory" WHERE symbol = $1
    `, [testData.symbol]);
    
    console.log(`📊 Total de registros com símbolo ${testData.symbol}: ${checkResult.rows[0].count}`);
    
    client.release();
    await pool.end();
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na inserção:', error.message);
    console.error('📋 Código do erro:', error.code);
    console.error('📋 Detalhes:', error);
  }
}

testInsert(); 