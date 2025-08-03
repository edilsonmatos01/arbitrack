const fetch = require('node-fetch');

async function testSpotFuturesTimezone() {
  console.log('🔍 TESTANDO CORREÇÃO DE TIMEZONE - SPOT VS FUTURES');
  console.log('==================================================\n');
  
  const baseUrl = 'http://localhost:3000';
  const symbol = 'WHITE_USDT';
  
  try {
    console.log(`📊 Testando símbolo: ${symbol}`);
    console.log(`🌍 Horário atual (Brasil): ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`🌍 Horário atual (UTC): ${new Date().toISOString()}`);
    
    // Teste 1: API de Price Comparison (Spot vs Futures)
    console.log('\n📡 Testando API Price Comparison (Spot vs Futures)...');
    const priceResponse = await fetch(`${baseUrl}/api/price-comparison/${encodeURIComponent(symbol)}`);
    const priceData = await priceResponse.json();
    
    console.log(`📊 Status: ${priceResponse.status}`);
    console.log(`📈 Quantidade de dados: ${Array.isArray(priceData) ? priceData.length : 'N/A'}`);
    
    if (Array.isArray(priceData) && priceData.length > 0) {
      console.log(`🕐 Primeiro registro: ${priceData[0].timestamp}`);
      console.log(`🕐 Último registro: ${priceData[priceData.length - 1].timestamp}`);
      
      // Verificar se os timestamps estão no formato correto
      const sampleTimestamp = priceData[0].timestamp;
      const timestampRegex = /^\d{2}\/\d{2} - \d{2}:\d{2}$/;
      
      if (timestampRegex.test(sampleTimestamp)) {
        console.log(`✅ Formato do timestamp está correto: ${sampleTimestamp}`);
        
        // Extrair hora do último registro
        const lastTimestamp = priceData[priceData.length - 1].timestamp;
        const [date, time] = lastTimestamp.split(' - ');
        const [hour, minute] = time.split(':').map(Number);
        
        console.log(`🕐 Último registro: ${lastTimestamp} (${hour}:${minute.toString().padStart(2, '0')})`);
        
        // Verificar se está próximo do horário atual
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const hourDiff = Math.abs(currentHour - hour);
        console.log(`⏰ Diferença de horas: ${hourDiff}h`);
        
        if (hourDiff <= 1) {
          console.log(`✅ Timezone parece correto! Último registro está próximo do horário atual.`);
        } else {
          console.log(`⚠️  POSSÍVEL PROBLEMA DE TIMEZONE! Diferença: ${hourDiff}h`);
          
          // Verificar se é exatamente 3 horas de diferença (problema conhecido)
          if (hourDiff === 3) {
            console.log(`🚨 PROBLEMA CONFIRMADO: Diferença de 3 horas (problema de timezone UTC vs SP)`);
          }
        }
      } else {
        console.log(`❌ Formato do timestamp está incorreto: ${sampleTimestamp}`);
      }
      
      // Mostrar os últimos 5 registros para análise
      console.log('\n📋 Últimos 5 registros:');
      const last5 = priceData.slice(-5);
      last5.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.timestamp}: Spot=${item.gateio_price}, Futures=${item.mexc_price}`);
      });
    }
    
    // Teste 2: Comparar com BRISE_USDT (que funciona)
    console.log('\n📡 Testando BRISE_USDT para comparação...');
    const briseResponse = await fetch(`${baseUrl}/api/price-comparison/BRISE_USDT`);
    const briseData = await briseResponse.json();
    
    if (Array.isArray(briseData) && briseData.length > 0) {
      console.log(`🕐 BRISE_USDT - Último registro: ${briseData[briseData.length - 1].timestamp}`);
      
      // Comparar timestamps
      if (Array.isArray(priceData) && priceData.length > 0) {
        const whiteLast = priceData[priceData.length - 1].timestamp;
        const briseLast = briseData[briseData.length - 1].timestamp;
        
        console.log(`📊 Comparação:`);
        console.log(`  WHITE_USDT: ${whiteLast}`);
        console.log(`  BRISE_USDT: ${briseLast}`);
        
        // Extrair horas para comparação
        const whiteHour = parseInt(whiteLast.split(' - ')[1].split(':')[0]);
        const briseHour = parseInt(briseLast.split(' - ')[1].split(':')[0]);
        
        const hourDiff = Math.abs(whiteHour - briseHour);
        console.log(`⏰ Diferença entre WHITE e BRISE: ${hourDiff}h`);
        
        if (hourDiff > 1) {
          console.log(`🚨 PROBLEMA CONFIRMADO: WHITE_USDT tem timezone diferente de BRISE_USDT`);
        } else {
          console.log(`✅ Timezones parecem consistentes entre WHITE e BRISE`);
        }
      }
    }
    
    // Teste 3: Testar com refresh forçado
    console.log('\n📡 Testando com refresh forçado...');
    const refreshResponse = await fetch(`${baseUrl}/api/price-comparison/${encodeURIComponent(symbol)}?refresh=true&nocache=true`);
    const refreshData = await refreshResponse.json();
    
    if (Array.isArray(refreshData) && refreshData.length > 0) {
      console.log(`📊 Status: ${refreshResponse.status}`);
      console.log(`📈 Quantidade de dados após refresh: ${refreshData.length}`);
      console.log(`🕐 Último registro após refresh: ${refreshData[refreshData.length - 1].timestamp}`);
      
      // Verificar se agora está atualizado
      const lastTimestamp = refreshData[refreshData.length - 1].timestamp;
      const [date, time] = lastTimestamp.split(' - ');
      const [hour, minute] = time.split(':').map(Number);
      
      const now = new Date();
      const currentHour = now.getHours();
      const hourDiff = Math.abs(currentHour - hour);
      
      console.log(`⏰ Diferença de horas após refresh: ${hourDiff}h`);
      
      if (hourDiff <= 1) {
        console.log(`✅ CACHE LIMPO COM SUCESSO! Agora está atualizado.`);
      } else {
        console.log(`⚠️  Cache limpo mas ainda há diferença de ${hourDiff}h`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testSpotFuturesTimezone(); 