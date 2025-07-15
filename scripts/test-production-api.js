const fetch = require('node-fetch');

async function testProductionAPI() {
  console.log('🌐 Testando APIs de produção com diferentes filtros...');
  
  const baseUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  
  // Testar diferentes endpoints
  const endpoints = [
    '/api/operation-history',
    '/api/operation-history?filter=all',
    '/api/operation-history?filter=24h',
    '/api/config/api-keys'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando: ${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`);
      const data = await response.json();
      
      console.log('Status:', response.status);
      console.log('Tipo de dados:', Array.isArray(data) ? 'Array' : typeof data);
      
      if (Array.isArray(data)) {
        console.log('Quantidade de itens:', data.length);
        if (data.length > 0) {
          console.log('Primeiro item:', JSON.stringify(data[0], null, 2));
        }
      } else {
        console.log('Dados:', JSON.stringify(data, null, 2));
      }
      
    } catch (error) {
      console.error(`❌ Erro ao testar ${endpoint}:`, error.message);
    }
  }
}

testProductionAPI().catch(console.error); 