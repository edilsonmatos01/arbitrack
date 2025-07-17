async function testSimpleFetch() {
  try {
    console.log('🧪 Teste simples de fetch...');
    
    const response = await fetch('http://localhost:10000/api/init-data-simple');
    console.log('📊 Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos com sucesso');
    console.log('📋 Estrutura dos dados:');
    console.log('   - timestamp:', typeof data.timestamp);
    console.log('   - symbols:', Array.isArray(data.symbols) ? data.symbols.length : 'não é array');
    console.log('   - maxSpreads:', Array.isArray(data.maxSpreads) ? data.maxSpreads.length : 'não é array');
    
    if (data.maxSpreads && Array.isArray(data.maxSpreads)) {
      console.log('\n📈 Primeiros 3 spreads:');
      data.maxSpreads.slice(0, 3).forEach(spread => {
        console.log(`   ${spread.symbol}: ${spread.maxSpread}%`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSimpleFetch(); 