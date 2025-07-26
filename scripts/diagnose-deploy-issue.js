const fetch = require('node-fetch');

async function diagnoseDeployIssue() {
  console.log('🔍 DIAGNÓSTICO: VERSÃO DEPLOYADA vs LOCAL');
  console.log('==========================================\n');
  
  const renderUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  
  // 1. Testar APIs básicas
  console.log('1️⃣ TESTANDO APIs BÁSICAS:');
  console.log('-------------------------');
  
  const basicApis = [
    '/api/health',
    '/api/test',
    '/api/positions',
    '/api/operation-history'
  ];
  
  for (const api of basicApis) {
    try {
      console.log(`\n📡 Testando: ${api}`);
      const response = await fetch(`${renderUrl}${api}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Funcionando`);
        if (api === '/api/health') {
          console.log(`   Environment: ${data.environment}`);
          console.log(`   Database: ${data.databaseUrl ? 'Configurada' : 'Não configurada'}`);
        }
      } else {
        console.log(`   ❌ Erro`);
      }
    } catch (error) {
      console.log(`   💥 Erro de conexão: ${error.message}`);
    }
  }
  
  // 2. Testar APIs de spread específicas
  console.log('\n2️⃣ TESTANDO APIs DE SPREAD:');
  console.log('----------------------------');
  
  const spreadApis = [
    '/api/spread-history?symbol=VANRY_USDT',
    '/api/spread-history?symbol=EPIC_USDT',
    '/api/spread-history?symbol=DEVVE_USDT',
    '/api/spread-history/24h/VANRY_USDT',
    '/api/spread-history/24h/EPIC_USDT',
    '/api/spread-history/24h/DEVVE_USDT'
  ];
  
  for (const api of spreadApis) {
    try {
      console.log(`\n📡 Testando: ${api}`);
      const response = await fetch(`${renderUrl}${api}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Dados: ${Array.isArray(data) ? data.length + ' registros' : 'objeto'}`);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   📊 Primeiro registro: ${data[0].symbol} - ${data[0].spread}%`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Erro: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   💥 Erro de conexão: ${error.message}`);
    }
  }
  
  // 3. Testar API de dados iniciais
  console.log('\n3️⃣ TESTANDO API DE DADOS INICIAIS:');
  console.log('-----------------------------------');
  
  try {
    console.log('\n📡 Testando: /api/init-data-simple');
    const response = await fetch(`${renderUrl}/api/init-data-simple`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Dados carregados`);
      console.log(`   📊 Spreads: ${Object.keys(data.spreads?.data || {}).length} pares`);
      console.log(`   📊 Posições: ${data.positions?.closed?.length || 0} posições`);
      
      // Verificar se VANRY_USDT e EPIC_USDT estão nos dados
      const spreads = data.spreads?.data || {};
      console.log(`   🔍 VANRY_USDT nos dados: ${spreads.VANRY_USDT ? '✅' : '❌'}`);
      console.log(`   🔍 EPIC_USDT nos dados: ${spreads.EPIC_USDT ? '✅' : '❌'}`);
      console.log(`   🔍 DEVVE_USDT nos dados: ${spreads.DEVVE_USDT ? '✅' : '❌'}`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Erro: ${errorText.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log(`   💥 Erro de conexão: ${error.message}`);
  }
  
  // 4. Testar API de arbitragem
  console.log('\n4️⃣ TESTANDO API DE ARBITRAGEM:');
  console.log('--------------------------------');
  
  try {
    console.log('\n📡 Testando: /api/arbitrage/all-data');
    const response = await fetch(`${renderUrl}/api/arbitrage/all-data`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Dados carregados`);
      console.log(`   📊 Oportunidades: ${data.opportunities?.length || 0}`);
      
      if (data.opportunities && data.opportunities.length > 0) {
        console.log(`   📝 Primeira oportunidade: ${data.opportunities[0].symbol} - ${data.opportunities[0].spread}%`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Erro: ${errorText.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log(`   💥 Erro de conexão: ${error.message}`);
  }
  
  // 5. Resumo e recomendações
  console.log('\n📋 RESUMO E RECOMENDAÇÕES:');
  console.log('===========================');
  console.log('• Se as APIs básicas falham: Problema de deploy/conectividade');
  console.log('• Se APIs de spread retornam 503: Problema de banco de dados');
  console.log('• Se APIs funcionam mas dados estão vazios: Problema de worker');
  console.log('• Se dados existem mas frontend não mostra: Problema de cache/frontend');
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Verificar logs do Render');
  console.log('2. Verificar status do banco de dados');
  console.log('3. Verificar se o worker está rodando');
  console.log('4. Limpar cache do frontend se necessário');
}

diagnoseDeployIssue(); 