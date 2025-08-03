const { Pool } = require('pg');

// Configuração específica para Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL + '?sslmode=require&connect_timeout=60&application_name=arbitragem',
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

async function insertTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Inserindo dados de teste na tabela SpreadHistory...');
    
    // Dados de teste para os últimos 24h
    const testData = [
      {
        symbol: 'BTC_USDT',
        exchangeBuy: 'Gate.io (Spot)',
        exchangeSell: 'MEXC (Futures)',
        direction: 'spot_to_futures',
        spread: 0.45,
        spotPrice: 65000.0,
        futuresPrice: 65292.5,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
      },
      {
        symbol: 'ETH_USDT',
        exchangeBuy: 'Gate.io (Spot)',
        exchangeSell: 'MEXC (Futures)',
        direction: 'spot_to_futures',
        spread: 0.32,
        spotPrice: 3200.0,
        futuresPrice: 3210.24,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 horas atrás
      },
      {
        symbol: 'SOL_USDT',
        exchangeBuy: 'Gate.io (Spot)',
        exchangeSell: 'MEXC (Futures)',
        direction: 'spot_to_futures',
        spread: 0.78,
        spotPrice: 150.0,
        futuresPrice: 151.17,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 horas atrás
      },
      {
        symbol: 'BTC_USDT',
        exchangeBuy: 'Gate.io (Spot)',
        exchangeSell: 'MEXC (Futures)',
        direction: 'spot_to_futures',
        spread: 0.52,
        spotPrice: 64800.0,
        futuresPrice: 65137.6,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 horas atrás
      },
      {
        symbol: 'ETH_USDT',
        exchangeBuy: 'Gate.io (Spot)',
        exchangeSell: 'MEXC (Futures)',
        direction: 'spot_to_futures',
        spread: 0.28,
        spotPrice: 3180.0,
        futuresPrice: 3188.9,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 horas atrás
      },
      {
        symbol: 'SOL_USDT',
        exchangeBuy: 'Gate.io (Spot)',
        exchangeSell: 'MEXC (Futures)',
        direction: 'spot_to_futures',
        spread: 0.95,
        spotPrice: 148.0,
        futuresPrice: 149.41,
        timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000) // 16 horas atrás
      },
      {
        symbol: 'BTC_USDT',
        exchangeBuy: 'Gate.io (Spot)',
        exchangeSell: 'MEXC (Futures)',
        direction: 'spot_to_futures',
        spread: 0.38,
        spotPrice: 65200.0,
        futuresPrice: 65447.76,
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000) // 20 horas atrás
      },
      {
        symbol: 'ETH_USDT',
        exchangeBuy: 'Gate.io (Spot)',
        exchangeSell: 'MEXC (Futures)',
        direction: 'spot_to_futures',
        spread: 0.41,
        spotPrice: 3220.0,
        futuresPrice: 3233.2,
        timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000) // 22 horas atrás
      }
    ];

    // Inserir dados de teste
    for (const data of testData) {
      const query = `
        INSERT INTO "SpreadHistory" (
          "id", "symbol", "exchangeBuy", "exchangeSell", "direction", 
          "spread", "spotPrice", "futuresPrice", "timestamp"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8
        )
      `;
      
      const values = [
        data.symbol,
        data.exchangeBuy,
        data.exchangeSell,
        data.direction,
        data.spread,
        data.spotPrice,
        data.futuresPrice,
        data.timestamp
      ];
      
      await client.query(query, values);
      console.log(`✅ Inserido: ${data.symbol} - ${data.spread}%`);
    }
    
    console.log('🎉 Dados de teste inseridos com sucesso!');
    
    // Verificar se os dados foram inseridos
    const countResult = await client.query('SELECT COUNT(*) as count FROM "SpreadHistory"');
    console.log(`📊 Total de registros na tabela: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados de teste:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

insertTestData(); 