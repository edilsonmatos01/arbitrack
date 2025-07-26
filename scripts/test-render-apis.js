// Script para testar APIs no Render
const RENDER_URL = 'https://robo-de-arbitragem.onrender.com';

async function testAPI(endpoint, name) {
  try {
    console.log(`\n🔍 Testando ${name}...`);
    console.log(`📡 URL: ${RENDER_URL}${endpoint}`);
    
    const response = await fetch(`${RENDER_URL}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Dados recebidos:`, data);
      
      if (Array.isArray(data)) {
        console.log(`📊 Total de registros: ${data.length}`);
        if (data.length > 0) {
          console.log(`📝 Primeiro registro:`, data[0]);
        }
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro: ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ Erro na API ${name}:`, error.message);
  }
}

async function testAllAPIs() {
  console.log('🚀 Iniciando testes das APIs no Render...');
  console.log('🌐 Render URL:', RENDER_URL);
  
  // APIs que o dashboard usa
  const apis = [
    { endpoint: '/api/operation-history?filter=all', name: 'Histórico de Operações' },
    { endpoint: '/api/config/api-keys', name: 'Configurações de API' },
    { endpoint: '/api/config/manual-balances', name: 'Saldos Manuais' },
    { endpoint: '/api/positions', name: 'Posições' }
  ];
  
  for (const api of apis) {
    await testAPI(api.endpoint, api.name);
  }
  
  console.log('\n✅ Testes concluídos!');
}

// Executar testes
testAllAPIs().catch(console.error); 