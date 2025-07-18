const fetch = require('node-fetch');

async function testEnvironmentVariables() {
  console.log('🔍 Testando variáveis de ambiente na produção...');
  
  const productionUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  
  try {
    // Testar endpoint que retorna informações do ambiente
    console.log('\n1️⃣ Testando /api/debug/timezone...');
    const response = await fetch(`${productionUrl}/api/debug/timezone`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Dados do ambiente:', data);
    } else {
      console.log(`❌ Status: ${response.status}`);
    }
    
    // Testar endpoint de health que pode ter mais informações
    console.log('\n2️⃣ Testando /api/health...');
    const healthResponse = await fetch(`${productionUrl}/api/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('📊 Health Data:', healthData);
    }
    
    // Testar se há algum endpoint que retorna configurações do banco
    console.log('\n3️⃣ Testando /api/test-db...');
    const dbResponse = await fetch(`${productionUrl}/api/test-db`);
    
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log('📊 DB Test Data:', dbData);
    } else {
      console.log(`❌ DB Test Status: ${dbResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar:', error.message);
  }
}

testEnvironmentVariables(); 