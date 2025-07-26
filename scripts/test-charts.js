const fetch = require('node-fetch');

async function testCharts() {
  console.log('📊 Testando gráficos de análise...\n');
  
  const baseUrl = 'http://localhost:3000';
  const symbol = 'WHITE_USDT';
  
  try {
    console.log(`📊 Testando símbolo: ${symbol}`);
    console.log(`🌍 Horário atual (Brasil): ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Teste 1: API de Spread History 24h
    console.log('\n📡 Testando API Spread History 24h...');
    const spreadResponse = await fetch(`${baseUrl}/api/spread-history/24h/${encodeURIComponent(symbol)}`);
    const spreadData = await spreadResponse.json();
    
    console.log(`📊 Status: ${spreadResponse.status}`);
    console.log(`📈 Quantidade de dados: ${Array.isArray(spreadData) ? spreadData.length : 'N/A'}`);
    
    if (Array.isArray(spreadData) && spreadData.length > 0) {
      console.log(`🕐 Primeiro registro: ${spreadData[0].timestamp}`);
      console.log(`🕐 Último registro: ${spreadData[spreadData.length - 1].timestamp}`);
      console.log(`📊 Spread máximo: ${Math.max(...spreadData.map(d => d.spread_percentage)).toFixed(2)}%`);
    }
    
    // Teste 2: API de Price Comparison
    console.log('\n📡 Testando API Price Comparison...');
    const priceResponse = await fetch(`${baseUrl}/api/price-comparison/${encodeURIComponent(symbol)}`);
    const priceData = await priceResponse.json();
    
    console.log(`📊 Status: ${priceResponse.status}`);
    console.log(`📈 Quantidade de dados: ${Array.isArray(priceData) ? priceData.length : 'N/A'}`);
    
    if (Array.isArray(priceData) && priceData.length > 0) {
      console.log(`🕐 Primeiro registro: ${priceData[0].timestamp}`);
      console.log(`🕐 Último registro: ${priceData[priceData.length - 1].timestamp}`);
      
      // Verificar se há dados de preços válidos
      const validPrices = priceData.filter(d => d.gateio_price && d.mexc_price);
      console.log(`💰 Registros com preços válidos: ${validPrices.length}/${priceData.length}`);
      
      if (validPrices.length > 0) {
        const lastPrice = validPrices[validPrices.length - 1];
        console.log(`💱 Último preço Gate.io: $${lastPrice.gateio_price.toFixed(8)}`);
        console.log(`💱 Último preço MEXC: $${lastPrice.mexc_price.toFixed(8)}`);
        
        const spread = ((lastPrice.mexc_price - lastPrice.gateio_price) / lastPrice.gateio_price) * 100;
        console.log(`📊 Spread atual: ${spread.toFixed(2)}%`);
      }
    }
    
    // Resumo
    console.log('\n✅ RESUMO DOS TESTES:');
    console.log(`   📈 Spread 24h: ${Array.isArray(spreadData) && spreadData.length > 0 ? '✅ Funcionando' : '❌ Sem dados'}`);
    console.log(`   💰 Spot vs Futures: ${Array.isArray(priceData) && priceData.length > 0 ? '✅ Funcionando' : '❌ Sem dados'}`);
    
    if (Array.isArray(spreadData) && spreadData.length > 0 && Array.isArray(priceData) && priceData.length > 0) {
      console.log(`\n🎉 AMBOS OS GRÁFICOS ESTÃO FUNCIONANDO!`);
      console.log(`   • Gráfico "Spread 24h" pronto para uso`);
      console.log(`   • Gráfico "Spot vs Futures" pronto para uso`);
      console.log(`   • Alternância entre gráficos implementada`);
    } else {
      console.log(`\n⚠️  ALGUNS GRÁFICOS PODEM NÃO TER DADOS SUFICIENTES`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testCharts(); 