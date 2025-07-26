const fetch = require('node-fetch');

async function testApi() {
  try {
    console.log('🔍 Testando API de spreads...');
    
    const response = await fetch('http://localhost:3000/api/init-data-simple?user_id=edilsonmatos');
    const data = await response.json();
    
    console.log('✅ API respondendo!');
    console.log(`📊 Total de spreads: ${Object.keys(data.spreads.data).length}`);
    
    // Verificar alguns símbolos específicos
    const symbols = ['VR_USDT', 'VVAIFU_USDT', 'DODO_USDT', 'GORK_USDT'];
    
    console.log('\n📋 Verificando símbolos específicos:');
    symbols.forEach(symbol => {
      const spreadData = data.spreads.data[symbol];
      if (spreadData) {
        console.log(`✅ ${symbol}: ${spreadData.spMax}% (${spreadData.crosses} registros)`);
      } else {
        console.log(`❌ ${symbol}: Não encontrado`);
      }
    });
    
    // Mostrar primeiros 5 símbolos
    console.log('\n📋 Primeiros 5 símbolos:');
    const first5 = Object.keys(data.spreads.data).slice(0, 5);
    first5.forEach(symbol => {
      const spreadData = data.spreads.data[symbol];
      console.log(`- ${symbol}: ${spreadData.spMax}%`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testApi(); 