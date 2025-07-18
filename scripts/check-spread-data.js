"use strict";
const { Pool } = require('pg');

// URL correta do banco que contém os dados
const DATABASE_URL = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

async function checkSpreadData() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Verificando dados da tabela SpreadHistory...\n');

    // Verificar os últimos 10 registros com detalhes
    const result = await pool.query(`
      SELECT 
        symbol,
        spread,
        "spotPrice",
        "futuresPrice",
        "exchangeBuy",
        "exchangeSell",
        direction,
        timestamp
      FROM "SpreadHistory" 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);

    console.log('📊 Últimos 10 spreads no banco:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol}`);
      console.log(`   Spread: ${row.spread}%`);
      console.log(`   Spot Price: ${row.spotPrice}`);
      console.log(`   Futures Price: ${row.futuresPrice}`);
      console.log(`   Exchange Buy: ${row.exchangeBuy}`);
      console.log(`   Exchange Sell: ${row.exchangeSell}`);
      console.log(`   Direction: ${row.direction}`);
      console.log(`   Timestamp: ${row.timestamp}`);
      console.log('');
    });

    // Verificar quantos registros têm preços zerados
    const zeroPricesResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM "SpreadHistory" 
      WHERE "spotPrice" = 0 OR "futuresPrice" = 0 OR "spotPrice" IS NULL OR "futuresPrice" IS NULL
    `);

    console.log(`❌ Registros com preços zerados/nulos: ${zeroPricesResult.rows[0].count}`);

    // Verificar quantos registros têm preços válidos
    const validPricesResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM "SpreadHistory" 
      WHERE "spotPrice" > 0 AND "futuresPrice" > 0
    `);

    console.log(`✅ Registros com preços válidos: ${validPricesResult.rows[0].count}`);

    // Buscar alguns registros com preços válidos
    const validDataResult = await pool.query(`
      SELECT 
        symbol,
        spread,
        "spotPrice",
        "futuresPrice",
        "exchangeBuy",
        "exchangeSell",
        direction,
        timestamp
      FROM "SpreadHistory" 
      WHERE "spotPrice" > 0 AND "futuresPrice" > 0
      ORDER BY timestamp DESC 
      LIMIT 5
    `);

    if (validDataResult.rows.length > 0) {
      console.log('\n✅ Exemplos de registros com preços válidos:');
      validDataResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.symbol} - Spread: ${row.spread}% - Spot: ${row.spotPrice} - Futures: ${row.futuresPrice}`);
      });
    } else {
      console.log('\n❌ Nenhum registro com preços válidos encontrado!');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await pool.end();
  }
}

checkSpreadData();
