const fetch = require('node-fetch');

async function testNewSpreadAPI() {
  console.log('🧪 Testando nova API Spread 24h...\n');
  
  const symbol = 'YBDBD_USDT';
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Testar API Spread 24h
    console.log('📊 Testando API Spread 24h...');
    const spreadResponse = await fetch(`${baseUrl}/api/spread-history/24h/${symbol}`);
    const spreadData = await spreadResponse.json();
    
    console.log(`✅ Status: ${spreadResponse.status}`);
    console.log(`📈 Registros retornados: ${spreadData.length}`);
    
    if (spreadData.length > 0) {
      console.log(`🕐 Primeiro registro: ${spreadData[0].timestamp}`);
      console.log(`🕐 Último registro: ${spreadData[spreadData.length - 1].timestamp}`);
      console.log(`📊 Spread máximo: ${Math.max(...spreadData.map(d => d.spread_percentage)).toFixed(4)}%`);
      console.log(`📊 Spread mínimo: ${Math.min(...spreadData.map(d => d.spread_percentage)).toFixed(4)}%`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Testar API Spot vs Futures para comparação
    console.log('📊 Testando API Spot vs Futures (para comparação)...');
    const priceResponse = await fetch(`${baseUrl}/api/price-comparison/${symbol}`);
    const priceData = await priceResponse.json();
    
    console.log(`✅ Status: ${priceResponse.status}`);
    console.log(`📈 Registros retornados: ${priceData.length}`);
    
    if (priceData.length > 0) {
      console.log(`🕐 Primeiro registro: ${priceData[0].timestamp}`);
      console.log(`🕐 Último registro: ${priceData[priceData.length - 1].timestamp}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Comparar horários
    if (spreadData.length > 0 && priceData.length > 0) {
      console.log('🔍 Comparando horários entre as APIs...');
      
      const spreadLastTime = spreadData[spreadData.length - 1].timestamp;
      const priceLastTime = priceData[priceData.length - 1].timestamp;
      
      console.log(`📊 Spread 24h - último horário: ${spreadLastTime}`);
      console.log(`📊 Spot vs Futures - último horário: ${priceLastTime}`);
      
      if (spreadLastTime === priceLastTime) {
        console.log('✅ Horários estão iguais!');
      } else {
        console.log('❌ Horários diferentes detectados!');
      }
      
      // Verificar se os horários estão no formato correto
      const timeRegex = /^\d{2}\/\d{2} - \d{2}:\d{2}$/;
      const spreadValid = timeRegex.test(spreadLastTime);
      const priceValid = timeRegex.test(priceLastTime);
      
      console.log(`📊 Spread 24h - formato válido: ${spreadValid ? '✅' : '❌'}`);
      console.log(`📊 Spot vs Futures - formato válido: ${priceValid ? '✅' : '❌'}`);
    }
    
    // Verificar se há dados suficientes
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('📊 Análise de dados:');
    console.log(`📈 Spread 24h: ${spreadData.length} pontos de dados`);
    console.log(`📈 Spot vs Futures: ${priceData.length} pontos de dados`);
    
    if (spreadData.length >= 20) {
      console.log('✅ Spread 24h tem dados suficientes para o gráfico');
    } else {
      console.log('⚠️ Spread 24h pode ter poucos dados');
    }
    
    if (priceData.length >= 20) {
      console.log('✅ Spot vs Futures tem dados suficientes para o gráfico');
    } else {
      console.log('⚠️ Spot vs Futures pode ter poucos dados');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testNewSpreadAPI(); 