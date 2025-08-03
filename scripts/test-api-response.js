const fetch = require('node-fetch');

console.log('🧪 TESTANDO RESPOSTA DA API');
console.log('===========================');

async function testAPI() {
  try {
    console.log('📡 Fazendo requisição para /api/init-data-simple...');
    const response = await fetch('http://localhost:3000/api/init-data-simple?user_id=edilsonmatos');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Resposta recebida com sucesso!');
    
    // Verificar estrutura dos dados
    console.log('\n📊 ESTRUTURA DOS DADOS:');
    console.log('- positions:', !!data.positions);
    console.log('- spreads:', !!data.spreads);
    console.log('- spreads.data:', !!data.spreads?.data);
    
    // Verificar dados de spread
    const spreadsData = data.spreads?.data || {};
    const symbols = Object.keys(spreadsData);
    
    console.log(`\n📈 DADOS DE SPREAD:`);
    console.log(`- Total de símbolos: ${symbols.length}`);
    
    // Mostrar dados para alguns símbolos
    const sampleSymbols = symbols.slice(0, 5);
    for (const symbol of sampleSymbols) {
      const spreadData = spreadsData[symbol];
      console.log(`${symbol}:`);
      console.log(`  - spMax: ${spreadData.spMax?.toFixed(4)}%`);
      console.log(`  - spMin: ${spreadData.spMin?.toFixed(4)}%`);
      console.log(`  - crosses: ${spreadData.crosses}`);
      console.log(`  - exchanges: ${spreadData.exchanges?.join(', ')}`);
    }
    
    // Verificar se há dados para os símbolos da tabela
    const tableSymbols = ['WHITE', 'DAG', 'PIN', 'VR', 'ANON', 'ALU'];
    console.log(`\n🎯 VERIFICANDO SÍMBOLOS DA TABELA:`);
    
    for (const symbol of tableSymbols) {
      const hasData = !!spreadsData[symbol];
      const spreadData = spreadsData[symbol];
      console.log(`${symbol}: ${hasData ? '✅' : '❌'} ${hasData ? `(Max: ${spreadData.spMax?.toFixed(4)}%)` : 'Sem dados'}`);
    }
    
    // Verificar se há dados com spMax > 0
    const symbolsWithData = symbols.filter(s => spreadsData[s].spMax > 0);
    console.log(`\n📊 RESUMO:`);
    console.log(`- Símbolos com dados: ${symbolsWithData.length}/${symbols.length}`);
    console.log(`- Símbolos com spMax > 0: ${symbolsWithData.length}`);
    
    if (symbolsWithData.length === 0) {
      console.log('⚠️  PROBLEMA: Nenhum símbolo tem spMax > 0!');
    } else {
      console.log('✅ Dados estão sendo retornados corretamente!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testAPI(); 