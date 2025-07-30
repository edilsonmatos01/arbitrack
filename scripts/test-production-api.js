const fetch = require('node-fetch');

async function testProductionAPI() {
  console.log('🔍 Testando API de produção...');
  
  const productionUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  
  try {
    // Testar API de operações
    console.log('\n1️⃣ Testando /api/operation-history...');
    const response = await fetch(`${productionUrl}/api/operation-history?filter=all`);
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API retornou ${data.length} operações`);
      
      if (data.length > 0) {
        console.log('📝 Primeira operação:');
        console.log(`   ID: ${data[0].id}`);
        console.log(`   Symbol: ${data[0].symbol}`);
        console.log(`   Profit/Loss USD: ${data[0].profitLossUsd}`);
        console.log(`   Profit/Loss %: ${data[0].profitLossPercent}`);
      } else {
        console.log('📝 Nenhuma operação encontrada');
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro na API: ${errorText}`);
    }
    
    // Testar API de health
    console.log('\n2️⃣ Testando /api/health...');
    const healthResponse = await fetch(`${productionUrl}/api/health`);
    console.log(`📊 Health Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('📊 Health Data:', healthData);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API de produção:', error.message);
  }
}

testProductionAPI(); 