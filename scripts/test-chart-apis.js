const fetch = require('node-fetch');

async function testChartAPIs() {
  const testSymbols = ['IDOL_USDT', 'SNS_USDT', 'LAT_USDT'];
  
  console.log('🧪 Testando APIs dos gráficos...\n');

  for (const symbol of testSymbols) {
    console.log(`📊 Testando ${symbol}:`);
    
    // Testar API Spread 24h
    try {
      console.log(`   🔍 Spread 24h (/api/spread-history/24h/${symbol}):`);
      const spreadResponse = await fetch(`http://localhost:10000/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      
      if (!spreadResponse.ok) {
        console.log(`      ❌ Status: ${spreadResponse.status} ${spreadResponse.statusText}`);
      } else {
        const spreadData = await spreadResponse.json();
        console.log(`      ✅ Status: ${spreadResponse.status}`);
        console.log(`      📈 Registros: ${spreadData.length}`);
        
        if (spreadData.length > 0) {
          const maxSpread = Math.max(...spreadData.map(d => d.spread_percentage || 0));
          console.log(`      📊 Spread máximo: ${maxSpread.toFixed(4)}%`);
          console.log(`      🕐 Primeiro: ${spreadData[0]?.timestamp || 'N/A'}`);
          console.log(`      🕐 Último: ${spreadData[spreadData.length - 1]?.timestamp || 'N/A'}`);
        } else {
          console.log(`      ⚠️  Nenhum dado disponível`);
        }
      }
    } catch (error) {
      console.log(`      ❌ Erro: ${error.message}`);
    }

    // Testar API Spot vs Futures
    try {
      console.log(`   🔍 Spot vs Futures (/api/price-comparison/${symbol}):`);
      const priceResponse = await fetch(`http://localhost:10000/api/price-comparison/${encodeURIComponent(symbol)}`);
      
      if (!priceResponse.ok) {
        console.log(`      ❌ Status: ${priceResponse.status} ${priceResponse.statusText}`);
      } else {
        const priceData = await priceResponse.json();
        console.log(`      ✅ Status: ${priceResponse.status}`);
        console.log(`      📈 Registros: ${priceData.length}`);
        
        if (priceData.length > 0) {
          const validSpot = priceData.filter(d => d.gateio_price !== null).length;
          const validFutures = priceData.filter(d => d.mexc_price !== null).length;
          console.log(`      💰 Dados Spot válidos: ${validSpot}/${priceData.length}`);
          console.log(`      💰 Dados Futures válidos: ${validFutures}/${priceData.length}`);
          console.log(`      🕐 Primeiro: ${priceData[0]?.timestamp || 'N/A'}`);
          console.log(`      🕐 Último: ${priceData[priceData.length - 1]?.timestamp || 'N/A'}`);
        } else {
          console.log(`      ⚠️  Nenhum dado disponível`);
        }
      }
    } catch (error) {
      console.log(`      ❌ Erro: ${error.message}`);
    }

    console.log(''); // Linha em branco
  }
}

testChartAPIs(); 