const fetch = require('node-fetch');

async function testConfigAPI() {
  console.log('🔧 Testando API de configuração de exchanges...');
  
  try {
    // Testar a API do Render (produção)
    const renderUrl = 'https://robo-de-arbitragem-5n8k.onrender.com/api/config/api-keys';
    console.log(`📡 Testando: ${renderUrl}`);
    
    const response = await fetch(renderUrl);
    const data = await response.json();
    
    console.log('✅ Resposta da API de configuração:');
    console.log('Status:', response.status);
    console.log('Dados:', JSON.stringify(data, null, 2));
    console.log('Tipo de dados:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('Quantidade de exchanges configuradas:', Array.isArray(data) ? data.length : 'N/A');
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('📋 Exchanges configuradas:');
      data.forEach((config, index) => {
        console.log(`${index + 1}. ${config.exchange} - Ativa: ${config.isActive}`);
      });
    } else {
      console.log('⚠️ Nenhuma exchange configurada encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API de configuração:', error.message);
  }
}

testConfigAPI().catch(console.error); 