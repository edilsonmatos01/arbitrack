const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 Testando API de operation-history...');
  
  try {
    // Testar a API local (se estiver rodando)
    const localUrl = 'http://localhost:10000/api/operation-history';
    console.log(`📡 Testando: ${localUrl}`);
    
    const response = await fetch(localUrl);
    const data = await response.json();
    
    console.log('✅ Resposta da API:');
    console.log('Status:', response.status);
    console.log('Dados:', JSON.stringify(data, null, 2));
    console.log('Tipo de dados:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('Quantidade de operações:', Array.isArray(data) ? data.length : 'N/A');
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('📊 Primeira operação:');
      console.log('- Símbolo:', data[0].symbol);
      console.log('- Lucro USD:', data[0].profitLossUsd);
      console.log('- Lucro %:', data[0].profitLossPercent);
      console.log('- Data:', data[0].finalizedAt);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    
    // Testar se o servidor está rodando
    console.log('\n🔍 Verificando se o servidor está rodando...');
    try {
      const serverResponse = await fetch('http://localhost:10000');
      console.log('✅ Servidor está rodando na porta 10000');
    } catch (serverError) {
      console.log('❌ Servidor não está rodando na porta 10000');
      console.log('💡 Execute: npm run dev');
    }
  }
}

// Testar também a API do Render (produção)
async function testRenderAPI() {
  console.log('\n🌐 Testando API do Render (produção)...');
  
  try {
    const renderUrl = 'https://robo-de-arbitragem-5n8k.onrender.com/api/operation-history';
    console.log(`📡 Testando: ${renderUrl}`);
    
    const response = await fetch(renderUrl);
    const data = await response.json();
    
    console.log('✅ Resposta da API do Render:');
    console.log('Status:', response.status);
    console.log('Dados:', JSON.stringify(data, null, 2));
    console.log('Tipo de dados:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('Quantidade de operações:', Array.isArray(data) ? data.length : 'N/A');
    
  } catch (error) {
    console.error('❌ Erro ao testar API do Render:', error.message);
  }
}

// Executar testes
async function runTests() {
  await testAPI();
  await testRenderAPI();
}

runTests().catch(console.error); 