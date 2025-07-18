const { Pool } = require('pg');

// URL correta do banco
const DATABASE_URL = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

// Preços reais aproximados das criptomoedas (para identificar dados fictícios)
const REAL_PRICES = {
  'BTC_USDT': { min: 60000, max: 70000 },
  'ETH_USDT': { min: 3000, max: 4000 },
  'SOL_USDT': { min: 100, max: 200 },
  'BNB_USDT': { min: 400, max: 600 },
  'ADA_USDT': { min: 0.4, max: 0.8 },
  'XRP_USDT': { min: 0.4, max: 0.8 },
  'DOGE_USDT': { min: 0.1, max: 0.2 },
  'MATIC_USDT': { min: 0.5, max: 1.0 },
  'DOT_USDT': { min: 5, max: 10 },
  'AVAX_USDT': { min: 20, max: 40 }
};

async function cleanAllFakeData() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🧹 Iniciando limpeza completa de dados fictícios...\n');

    // Contar total de registros
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM "SpreadHistory"');
    const totalRecords = parseInt(totalResult.rows[0].count);
    console.log(`📊 Total de registros no banco: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('✅ Banco vazio. Nada a limpar.');
      return;
    }

    // Identificar dados fictícios baseado em preços irreais
    let fakeDataCount = 0;
    let fakeDataExamples = [];

    for (const [symbol, priceRange] of Object.entries(REAL_PRICES)) {
      const fakeResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM "SpreadHistory" 
        WHERE symbol = $1 
        AND ("spotPrice" < $2 OR "spotPrice" > $3 OR "futuresPrice" < $2 OR "futuresPrice" > $3)
      `, [symbol, priceRange.min, priceRange.max]);

      const count = parseInt(fakeResult.rows[0].count);
      fakeDataCount += count;

      if (count > 0) {
        // Buscar exemplos
        const examplesResult = await pool.query(`
          SELECT symbol, spread, "spotPrice", "futuresPrice", timestamp
          FROM "SpreadHistory" 
          WHERE symbol = $1 
          AND ("spotPrice" < $2 OR "spotPrice" > $3 OR "futuresPrice" < $2 OR "futuresPrice" > $3)
          ORDER BY timestamp DESC 
          LIMIT 3
        `, [symbol, priceRange.min, priceRange.max]);

        fakeDataExamples.push(...examplesResult.rows);
      }
    }

    // Também verificar registros com preços zerados/nulos
    const zeroResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM "SpreadHistory" 
      WHERE "spotPrice" = 0 OR "futuresPrice" = 0 OR "spotPrice" IS NULL OR "futuresPrice" IS NULL
    `);
    const zeroCount = parseInt(zeroResult.rows[0].count);
    fakeDataCount += zeroCount;

    console.log(`🚨 Encontrados ${fakeDataCount} registros com dados fictícios`);
    console.log(`   - Dados com preços irreais: ${fakeDataCount - zeroCount}`);
    console.log(`   - Dados com preços zerados: ${zeroCount}`);

    if (fakeDataCount === 0) {
      console.log('✅ Nenhum dado fictício encontrado. Banco está limpo!');
      return;
    }

    // Mostrar exemplos
    console.log('\n📝 Exemplos de dados fictícios encontrados:');
    fakeDataExamples.slice(0, 10).forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol} - Spread: ${row.spread}% - Spot: ${row.spotPrice} - Futures: ${row.futuresPrice} - ${row.timestamp}`);
    });

    // Deletar dados fictícios
    console.log('\n🗑️  Deletando dados fictícios...');
    
    // Deletar por símbolos específicos com preços irreais
    for (const [symbol, priceRange] of Object.entries(REAL_PRICES)) {
      const deleteResult = await pool.query(`
        DELETE FROM "SpreadHistory" 
        WHERE symbol = $1 
        AND ("spotPrice" < $2 OR "spotPrice" > $3 OR "futuresPrice" < $2 OR "futuresPrice" > $3)
      `, [symbol, priceRange.min, priceRange.max]);

      if (deleteResult.rowCount > 0) {
        console.log(`   ✅ Deletados ${deleteResult.rowCount} registros fictícios de ${symbol}`);
      }
    }

    // Deletar registros com preços zerados
    const deleteZeroResult = await pool.query(`
      DELETE FROM "SpreadHistory" 
      WHERE "spotPrice" = 0 OR "futuresPrice" = 0 OR "spotPrice" IS NULL OR "futuresPrice" IS NULL
    `);

    if (deleteZeroResult.rowCount > 0) {
      console.log(`   ✅ Deletados ${deleteZeroResult.rowCount} registros com preços zerados`);
    }

    // Verificar resultado final
    const finalResult = await pool.query('SELECT COUNT(*) as count FROM "SpreadHistory"');
    const finalCount = parseInt(finalResult.rows[0].count);
    
    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`   - Registros deletados: ${totalRecords - finalCount}`);
    console.log(`   - Registros restantes: ${finalCount}`);

    // Mostrar alguns registros válidos restantes
    const validResult = await pool.query(`
      SELECT symbol, spread, "spotPrice", "futuresPrice", timestamp
      FROM "SpreadHistory" 
      ORDER BY timestamp DESC 
      LIMIT 5
    `);

    if (validResult.rows.length > 0) {
      console.log('\n✅ Exemplos de registros válidos restantes:');
      validResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.symbol} - Spread: ${row.spread}% - Spot: ${row.spotPrice} - Futures: ${row.futuresPrice}`);
      });
    } else {
      console.log('\n⚠️  Nenhum registro válido restante no banco.');
    }

  } catch (error) {
    console.error('❌ Erro ao limpar dados fictícios:', error);
  } finally {
    await pool.end();
  }
}

cleanAllFakeData(); 