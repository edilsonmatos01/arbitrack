const fetch = require('node-fetch');

console.log('🧪 TESTE SIMPLES - TABELA DE ARBITRAGEM');
console.log('========================================');

// Teste 1: Verificar se o frontend está rodando
async function testFrontend() {
  console.log('\n🔌 Teste 1: Verificando frontend...');
  
  try {
    const response = await fetch('http://localhost:3000');
    console.log('✅ Frontend está rodando (status:', response.status, ')');
    return true;
  } catch (error) {
    console.log('❌ Frontend não está rodando:', error.message);
    return false;
  }
}

// Teste 2: Verificar API de oportunidades
async function testOpportunitiesAPI() {
  console.log('\n🔌 Teste 2: Verificando API de oportunidades...');
  
  try {
    const response = await fetch('http://localhost:3000/api/arbitrage/all-opportunities');
    const data = await response.json();
    
    console.log('📊 Oportunidades na API:', data.length);
    if (data.length > 0) {
      console.log('🎯 Primeira oportunidade:');
      console.log('   Símbolo:', data[0].baseSymbol);
      console.log('   Spread:', data[0].profitPercentage?.toFixed(4) + '%');
      console.log('   Timestamp:', new Date(data[0].timestamp).toLocaleString());
    }
    
    return data.length > 0;
  } catch (error) {
    console.log('❌ Erro ao acessar API:', error.message);
    return false;
  }
}

// Teste 3: Verificar dados de spread
async function testSpreadData() {
  console.log('\n🔌 Teste 3: Verificando dados de spread...');
  
  try {
    const response = await fetch('http://localhost:3000/api/spreads/max');
    const data = await response.json();
    
    console.log('📊 Dados de spread encontrados:', data.length);
    if (data.length > 0) {
      console.log('📈 Maior spread:', data[0].symbol, data[0].maxSpread?.toFixed(4) + '%');
    }
    
    return data.length > 0;
  } catch (error) {
    console.log('❌ Erro ao acessar dados de spread:', error.message);
    return false;
  }
}

// Teste 4: Verificar dados de spread history
async function testSpreadHistory() {
  console.log('\n🔌 Teste 4: Verificando histórico de spread...');
  
  try {
    const response = await fetch('http://localhost:3000/api/spread-history');
    const data = await response.json();
    
    console.log('📊 Histórico de spread encontrado:', data.length, 'registros');
    if (data.length > 0) {
      console.log('📈 Último registro:', data[data.length - 1]);
    }
    
    return data.length > 0;
  } catch (error) {
    console.log('❌ Erro ao acessar histórico de spread:', error.message);
    return false;
  }
}

// Teste 5: Verificar dados de operações
async function testOperations() {
  console.log('\n🔌 Teste 5: Verificando operações...');
  
  try {
    const response = await fetch('http://localhost:3000/api/operation-history');
    const data = await response.json();
    
    console.log('📊 Operações encontradas:', data.length);
    if (data.length > 0) {
      console.log('📈 Última operação:', data[data.length - 1]);
    }
    
    return data.length > 0;
  } catch (error) {
    console.log('❌ Erro ao acessar operações:', error.message);
    return false;
  }
}

// Função principal
async function runSimpleTest() {
  console.log('🚀 Iniciando teste simples...\n');
  
  const frontendRunning = await testFrontend();
  
  if (!frontendRunning) {
    console.log('\n❌ Frontend não está rodando. Inicie o frontend primeiro.');
    console.log('   Comando: npm run dev');
    return;
  }
  
  const hasOpportunities = await testOpportunitiesAPI();
  const hasSpreadData = await testSpreadData();
  const hasSpreadHistory = await testSpreadHistory();
  const hasOperations = await testOperations();
  
  // Resumo
  console.log('\n📊 RESUMO DO TESTE:');
  console.log('===================');
  console.log('✅ Frontend:', frontendRunning ? 'Rodando' : 'Parado');
  console.log('✅ API Oportunidades:', hasOpportunities ? 'Com dados' : 'Sem dados');
  console.log('✅ Dados de Spread:', hasSpreadData ? 'Com dados' : 'Sem dados');
  console.log('✅ Histórico de Spread:', hasSpreadHistory ? 'Com dados' : 'Sem dados');
  console.log('✅ Operações:', hasOperations ? 'Com dados' : 'Sem dados');
  
  if (hasOpportunities || hasSpreadData || hasSpreadHistory) {
    console.log('\n🎉 SUCESSO: Dados estão chegando até a tabela!');
  } else {
    console.log('\n⚠️  ATENÇÃO: Nenhum dado encontrado na tabela.');
    console.log('   Verifique se o worker está processando e salvando dados.');
  }
  
  console.log('\n🏁 TESTE CONCLUÍDO');
}

// Executar teste
runSimpleTest().catch(console.error); 