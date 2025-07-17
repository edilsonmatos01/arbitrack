const fetch = require('node-fetch');

async function testFixedAPI() {
  try {
    console.log('🧪 Testando API corrigida...\n');

    // Testar API da tabela (spread máximo)
    console.log('📊 Testando API da tabela (/api/spreads/LAT_USDT/max):');
    try {
      const response = await fetch('http://localhost:3000/api/spreads/LAT_USDT/max');
      const data = await response.json();
      console.log(`   Status: ${response.status}`);
      console.log(`   spMax: ${data.spMax}`);
      console.log(`   crosses: ${data.crosses}`);
      
      if (data.spMax && data.spMax > 0) {
        console.log(`   ✅ API retornando dados reais: ${data.spMax.toFixed(4)}%`);
      } else {
        console.log(`   ❌ API ainda retornando dados simulados`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }

    // Testar API do gráfico
    console.log('\n📈 Testando API do gráfico (/api/spread-history/24h/LAT_USDT):');
    try {
      const response = await fetch('http://localhost:3000/api/spread-history/24h/LAT_USDT');
      const data = await response.json();
      console.log(`   Status: ${response.status}`);
      console.log(`   Registros: ${data.length}`);
      
      if (data.length > 0) {
        const maxSpread = Math.max(...data.map(d => d.spread_percentage));
        console.log(`   Máximo no gráfico: ${maxSpread.toFixed(4)}%`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }

    // Testar outros símbolos para verificar se a correção é global
    console.log('\n🌐 Testando outros símbolos:');
    const testSymbols = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];
    
    for (const symbol of testSymbols) {
      try {
        const response = await fetch(`http://localhost:3000/api/spreads/${symbol}/max`);
        const data = await response.json();
        console.log(`   ${symbol}: ${data.spMax?.toFixed(4) || 'N/A'}% (${data.crosses} registros)`);
      } catch (error) {
        console.log(`   ${symbol}: ❌ Erro`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFixedAPI(); 