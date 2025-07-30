const { dbConnection } = require('../lib/db-connection.ts');

async function checkSpreadData() {
  try {
    console.log('🔍 Verificando dados de SpreadHistory...');
    
    // Testar conexão
    const testResult = await dbConnection.testConnection();
    console.log('✅ Conexão OK:', testResult[0]);
    
    // Contar total de registros
    const totalCount = await dbConnection.getSpreadHistoryCount();
    console.log(`📊 Total de registros: ${totalCount}`);
    
    // Buscar últimos registros
    const lastRecords = await dbConnection.getSpreadHistory(10);
    console.log('🕒 Últimos registros:');
    lastRecords.forEach(record => {
      console.log(`  ${record.symbol}: ${record.spread}% em ${record.timestamp}`);
    });
    
    // Verificar spreads máximos por símbolo nas últimas 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const maxSpreadsQuery = `
      SELECT symbol, MAX(spread) as max_spread, COUNT(*) as count
      FROM "SpreadHistory" 
      WHERE "timestamp" >= $1
      GROUP BY symbol
      ORDER BY max_spread DESC
      LIMIT 10
    `;
    
    const maxSpreads = await dbConnection.executeQuery(maxSpreadsQuery, [twentyFourHoursAgo]);
    console.log('📈 Spreads máximos das últimas 24h:');
    maxSpreads.forEach(row => {
      console.log(`  ${row.symbol}: ${row.max_spread}% (${row.count} registros)`);
    });
    
    // Verificar símbolos únicos
    const uniqueSymbolsQuery = 'SELECT DISTINCT symbol FROM "SpreadHistory" LIMIT 10';
    const uniqueSymbols = await dbConnection.executeQuery(uniqueSymbolsQuery);
    console.log('📋 Símbolos únicos (primeiros 10):', uniqueSymbols.map(r => r.symbol));
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  } finally {
    await dbConnection.close();
  }
}

checkSpreadData(); 