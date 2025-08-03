async function testInitData() {
  try {
    console.log('🧪 Testando API /api/init-data...');
    
    const startTime = Date.now();
    const response = await fetch('http://localhost:10000/api/init-data');
    const endTime = Date.now();
    
    console.log(`⏱️  Tempo de resposta: ${endTime - startTime}ms`);
    console.log(`📊 Status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('\n📋 Dados recebidos:');
    console.log(`   Timestamp: ${data.timestamp}`);
    console.log(`   Símbolos: ${data.symbols?.length || 0}`);
    console.log(`   Spreads máximos: ${data.maxSpreads?.length || 0}`);
    
    console.log('\n📈 Spreads máximos encontrados:');
    if (data.maxSpreads) {
      data.maxSpreads.forEach(spread => {
        if (spread.maxSpread > 0) {
          console.log(`   ${spread.symbol}: ${spread.maxSpread.toFixed(2)}%`);
        }
      });
    }
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testInitData(); 