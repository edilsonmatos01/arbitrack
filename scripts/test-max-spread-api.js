const fetch = require('node-fetch');

async function testMaxSpreadAPI() {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  
  console.log('🔍 Testando API de Spread Máximo 24h...\n');
  
  for (const symbol of symbols) {
    try {
      console.log(`📊 Testando ${symbol}:`);
      
      // Teste 1: API de spread máximo
      const maxResponse = await fetch(`http://localhost:3000/api/spreads/${encodeURIComponent(symbol)}/max`);
      const maxData = await maxResponse.json();
      console.log(`  Spread Máximo API:`, maxData);
      
      // Teste 2: API de histórico 24h
      const historyResponse = await fetch(`http://localhost:3000/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      const historyData = await historyResponse.json();
      
      if (historyData && historyData.length > 0) {
        const maxFromHistory = Math.max(...historyData.map(item => item.spread_percentage));
        console.log(`  Registros no histórico: ${historyData.length}`);
        console.log(`  Spread máximo do histórico: ${maxFromHistory}%`);
        console.log(`  Últimos 5 registros:`, historyData.slice(-5).map(item => ({
          timestamp: item.timestamp,
          spread: item.spread_percentage
        })));
      } else {
        console.log(`  ❌ Nenhum dado encontrado no histórico`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Erro ao testar ${symbol}:`, error.message);
    }
  }
}

testMaxSpreadAPI().catch(console.error); 