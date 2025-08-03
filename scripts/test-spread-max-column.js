const fetch = require('node-fetch');

console.log('🎯 TESTANDO COLUNA SPREAD MÁXIMO');
console.log('=================================');

async function testSpreadMaxColumn() {
  try {
    // Testar API diretamente
    console.log('📡 Testando API /api/init-data-simple...');
    const response = await fetch('http://localhost:3000/api/init-data-simple?user_id=edilsonmatos');
    const data = await response.json();
    
    const spreadsData = data.spreads?.data || {};
    
    // Verificar símbolos específicos da tabela
    const tableSymbols = ['WHITE', 'DAG', 'PIN', 'VR', 'ANON', 'ALU'];
    
    console.log('\n📊 DADOS DISPONÍVEIS NA API:');
    for (const symbol of tableSymbols) {
      const spreadData = spreadsData[symbol];
      if (spreadData) {
        console.log(`${symbol}:`);
        console.log(`  ✅ spMax: ${spreadData.spMax?.toFixed(4)}%`);
        console.log(`  ✅ spMin: ${spreadData.spMin?.toFixed(4)}%`);
        console.log(`  ✅ crosses: ${spreadData.crosses}`);
        console.log(`  ✅ exchanges: ${spreadData.exchanges?.join(', ')}`);
      } else {
        console.log(`${symbol}: ❌ Sem dados`);
      }
    }
    
    // Verificar se há dados suficientes
    const symbolsWithData = tableSymbols.filter(s => spreadsData[s] && spreadsData[s].spMax > 0);
    
    console.log(`\n📈 RESUMO:`);
    console.log(`- Símbolos com dados: ${symbolsWithData.length}/${tableSymbols.length}`);
    
    if (symbolsWithData.length === tableSymbols.length) {
      console.log('✅ TODOS os símbolos têm dados de spread máximo!');
      console.log('✅ A coluna deve aparecer corretamente no frontend.');
      console.log('\n💡 Se ainda não aparecer, tente:');
      console.log('   1. Recarregar a página (Ctrl+F5)');
      console.log('   2. Limpar cache do navegador');
      console.log('   3. Verificar console do navegador para erros');
    } else {
      console.log('⚠️  Alguns símbolos ainda não têm dados.');
    }
    
    // Testar se o worker está salvando dados continuamente
    console.log('\n🔍 VERIFICANDO SE WORKER ESTÁ SALVANDO DADOS...');
    console.log('💡 O worker deve estar salvando dados automaticamente.');
    console.log('💡 Verifique os logs do worker para confirmar.');
    
  } catch (error) {
    console.error('❌ Erro ao testar:', error.message);
  }
}

testSpreadMaxColumn(); 