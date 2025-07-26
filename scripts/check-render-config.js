const fetch = require('node-fetch');

async function checkRenderConfiguration() {
  console.log('🔍 Verificando configuração da Render...');
  
  const productionUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  
  try {
    // 1. Testar API de operações com diferentes filtros
    console.log('\n1️⃣ Testando API de operações...');
    
    const endpoints = [
      '/api/operation-history',
      '/api/operation-history?filter=all',
      '/api/operation-history?filter=24h'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n📡 Testando: ${endpoint}`);
      const response = await fetch(`${productionUrl}${endpoint}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Operações: ${Array.isArray(data) ? data.length : 'N/A'}`);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   Primeira: ${data[0].symbol} - $${data[0].profitLossUsd}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   Erro: ${errorText.substring(0, 100)}...`);
      }
    }
    
    // 2. Testar outras APIs para verificar se o problema é específico
    console.log('\n2️⃣ Testando outras APIs...');
    
    const otherApis = [
      '/api/spread-history',
      '/api/positions',
      '/api/config/manual-balances'
    ];
    
    for (const api of otherApis) {
      console.log(`\n📡 Testando: ${api}`);
      const response = await fetch(`${productionUrl}${api}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Dados: ${Array.isArray(data) ? data.length + ' itens' : 'objeto'}`);
      }
    }
    
    // 3. Testar endpoint de teste do banco
    console.log('\n3️⃣ Testando endpoint de teste do banco...');
    const dbTestResponse = await fetch(`${productionUrl}/api/test-db`);
    console.log(`   Status: ${dbTestResponse.status}`);
    
    if (dbTestResponse.ok) {
      const dbData = await dbTestResponse.json();
      console.log('   Dados do banco:', dbData);
    } else {
      const errorText = await dbTestResponse.text();
      console.log(`   Erro: ${errorText.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar configuração:', error.message);
  }
}

checkRenderConfiguration(); 