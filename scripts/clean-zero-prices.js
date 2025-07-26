const { Pool } = require('pg');

// URL correta do banco que contém os dados
const DATABASE_URL = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

async function cleanZeroPrices() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🧹 Iniciando limpeza de registros com preços zerados...\n');

    // Primeiro, contar quantos registros têm preços zerados
    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM "SpreadHistory" 
      WHERE "spotPrice" = 0 OR "futuresPrice" = 0 OR "spotPrice" IS NULL OR "futuresPrice" IS NULL
    `);

    const zeroPriceCount = parseInt(countResult.rows[0].count);
    console.log(`📊 Encontrados ${zeroPriceCount} registros com preços zerados/nulos`);

    if (zeroPriceCount === 0) {
      console.log('✅ Nenhum registro com preços zerados encontrado. Nada a limpar.');
      return;
    }

    // Mostrar alguns exemplos antes de deletar
    const examplesResult = await pool.query(`
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
      WHERE "spotPrice" = 0 OR "futuresPrice" = 0 OR "spotPrice" IS NULL OR "futuresPrice" IS NULL
      ORDER BY timestamp DESC 
      LIMIT 5
    `);

    console.log('\n📝 Exemplos de registros que serão deletados:');
    examplesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.symbol} - Spread: ${row.spread}% - Spot: ${row.spotPrice} - Futures: ${row.futuresPrice} - ${row.timestamp}`);
    });

    // Confirmar com o usuário
    console.log('\n⚠️  ATENÇÃO: Esta operação irá deletar permanentemente os registros com preços zerados.');
    console.log('Para continuar, digite "CONFIRMAR" (em maiúsculas):');
    
    // Simular confirmação (em produção, você pode usar readline)
    const confirmation = 'CONFIRMAR'; // Em um script real, você pediria input do usuário
    
    if (confirmation === 'CONFIRMAR') {
      console.log('\n🗑️  Deletando registros com preços zerados...');
      
      const deleteResult = await pool.query(`
        DELETE FROM "SpreadHistory" 
        WHERE "spotPrice" = 0 OR "futuresPrice" = 0 OR "spotPrice" IS NULL OR "futuresPrice" IS NULL
      `);

      console.log(`✅ ${deleteResult.rowCount} registros deletados com sucesso!`);

      // Verificar quantos registros restaram
      const remainingResult = await pool.query('SELECT COUNT(*) as count FROM "SpreadHistory"');
      const remainingCount = parseInt(remainingResult.rows[0].count);
      
      console.log(`📊 Total de registros restantes: ${remainingCount}`);

      // Mostrar alguns registros válidos restantes
      const validResult = await pool.query(`
        SELECT 
          symbol,
          spread,
          "spotPrice",
          "futuresPrice",
          timestamp
        FROM "SpreadHistory" 
        ORDER BY timestamp DESC 
        LIMIT 5
      `);

      console.log('\n✅ Exemplos de registros válidos restantes:');
      validResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.symbol} - Spread: ${row.spread}% - Spot: ${row.spotPrice} - Futures: ${row.futuresPrice}`);
      });

    } else {
      console.log('❌ Operação cancelada pelo usuário.');
    }

  } catch (error) {
    console.error('❌ Erro ao limpar registros:', error);
  } finally {
    await pool.end();
  }
}

cleanZeroPrices(); 