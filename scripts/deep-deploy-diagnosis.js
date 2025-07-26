const fetch = require('node-fetch');

async function deepDeployDiagnosis() {
  console.log('🔍 DIAGNÓSTICO PROFUNDO: LOCAL vs DEPLOY');
  console.log('=========================================\n');
  
  const renderUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  
  // 1. Verificar se as paridades estão sendo monitoradas
  console.log('1️⃣ VERIFICANDO MONITORAMENTO DE PARIDADES:');
  console.log('--------------------------------------------');
  
  const testPairs = ['VANRY_USDT', 'EPIC_USDT', 'DEVVE_USDT'];
  
  for (const pair of testPairs) {
    try {
      console.log(`\n📡 Testando monitoramento: ${pair}`);
      
      // Testar API de spread history
      const spreadResponse = await fetch(`${renderUrl}/api/spread-history?symbol=${pair}`);
      const spreadData = await spreadResponse.json();
      
      console.log(`   📊 Spread History: ${spreadData.length} registros`);
      
      if (spreadData.length > 0) {
        const latest = spreadData[spreadData.length - 1];
        console.log(`   📅 Último registro: ${latest.createdAt} - Spread: ${latest.spread}%`);
      }
      
      // Testar API de 24h
      const dayResponse = await fetch(`${renderUrl}/api/spread-history/24h/${pair}`);
      const dayData = await dayResponse.json();
      
      console.log(`   📊 24h History: ${dayData.length} registros`);
      
      if (dayData.length > 0) {
        const latest = dayData[dayData.length - 1];
        console.log(`   📅 Último 24h: ${latest.time} - Spread: ${latest.spread}%`);
      }
      
    } catch (error) {
      console.log(`   💥 Erro: ${error.message}`);
    }
  }
  
  // 2. Verificar dados brutos do banco
  console.log('\n2️⃣ VERIFICANDO DADOS BRUTOS DO BANCO:');
  console.log('--------------------------------------');
  
  try {
    console.log('\n📡 Testando: /api/all-data');
    const response = await fetch(`${renderUrl}/api/arbitrage/all-data`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Dados carregados`);
      
      // Verificar spreads
      if (data.spreads && data.spreads.data) {
        const spreads = data.spreads.data;
        console.log(`   📊 Total de spreads: ${Object.keys(spreads).length}`);
        
        // Verificar paridades específicas
        for (const pair of testPairs) {
          const spread = spreads[pair];
          if (spread) {
            console.log(`   ✅ ${pair}: ${spread.spread}% (${spread.gateioPrice} / ${spread.mexcPrice})`);
          } else {
            console.log(`   ❌ ${pair}: Não encontrado`);
          }
        }
      }
      
      // Verificar oportunidades
      if (data.opportunities) {
        console.log(`   📊 Oportunidades: ${data.opportunities.length}`);
        if (data.opportunities.length > 0) {
          console.log(`   📝 Primeiras oportunidades:`);
          data.opportunities.slice(0, 3).forEach(opp => {
            console.log(`      - ${opp.symbol}: ${opp.spread}%`);
          });
        }
      }
    } else {
      console.log(`   ❌ Erro: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   💥 Erro: ${error.message}`);
  }
  
  // 3. Verificar configuração de paridades
  console.log('\n3️⃣ VERIFICANDO CONFIGURAÇÃO DE PARIDADES:');
  console.log('------------------------------------------');
  
  try {
    console.log('\n📡 Testando: /api/init-data-simple');
    const response = await fetch(`${renderUrl}/api/init-data-simple`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Verificar se as paridades estão na lista de spreads
      const spreads = data.spreads?.data || {};
      const spreadKeys = Object.keys(spreads);
      
      console.log(`   📊 Total de spreads disponíveis: ${spreadKeys.length}`);
      
      // Verificar paridades específicas
      for (const pair of testPairs) {
        if (spreadKeys.includes(pair)) {
          console.log(`   ✅ ${pair}: Presente nos spreads`);
        } else {
          console.log(`   ❌ ${pair}: Ausente dos spreads`);
        }
      }
      
      // Mostrar algumas paridades que estão funcionando
      const workingPairs = spreadKeys.filter(key => 
        testPairs.includes(key) && spreads[key] && spreads[key].spread
      );
      
      if (workingPairs.length > 0) {
        console.log(`   🔍 Paridades funcionando: ${workingPairs.join(', ')}`);
      }
      
      // Mostrar algumas paridades que não estão funcionando
      const nonWorkingPairs = testPairs.filter(pair => 
        !spreadKeys.includes(pair) || !spreads[pair] || !spreads[pair].spread
      );
      
      if (nonWorkingPairs.length > 0) {
        console.log(`   🔍 Paridades com problema: ${nonWorkingPairs.join(', ')}`);
      }
      
    } else {
      console.log(`   ❌ Erro: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   💥 Erro: ${error.message}`);
  }
  
  // 4. Verificar se é problema de cache
  console.log('\n4️⃣ VERIFICANDO CACHE:');
  console.log('---------------------');
  
  try {
    console.log('\n📡 Testando com cache limpo: /api/init-data-simple?refresh=true');
    const response = await fetch(`${renderUrl}/api/init-data-simple?refresh=true`);
    
    if (response.ok) {
      const data = await response.json();
      const spreads = data.spreads?.data || {};
      
      console.log(`   📊 Após limpar cache: ${Object.keys(spreads).length} spreads`);
      
      for (const pair of testPairs) {
        if (spreads[pair]) {
          console.log(`   ✅ ${pair}: ${spreads[pair].spread}%`);
        } else {
          console.log(`   ❌ ${pair}: Ainda ausente`);
        }
      }
    } else {
      console.log(`   ❌ Erro: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   💥 Erro: ${error.message}`);
  }
  
  // 5. Verificar worker status
  console.log('\n5️⃣ VERIFICANDO STATUS DO WORKER:');
  console.log('--------------------------------');
  
  try {
    console.log('\n📡 Testando: /api/health');
    const response = await fetch(`${renderUrl}/api/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   🔧 Environment: ${data.environment}`);
      console.log(`   🗄️ Database: ${data.databaseUrl ? 'Configurada' : 'Não configurada'}`);
      console.log(`   ⏰ Timestamp: ${data.timestamp}`);
      
      // Verificar se há informações sobre o worker
      if (data.workerStatus) {
        console.log(`   🤖 Worker: ${data.workerStatus}`);
      }
    }
  } catch (error) {
    console.log(`   💥 Erro: ${error.message}`);
  }
  
  // 6. Resumo e conclusões
  console.log('\n📋 ANÁLISE E CONCLUSÕES:');
  console.log('=========================');
  console.log('• Se dados existem no banco mas não aparecem no frontend: Problema de cache/API');
  console.log('• Se dados não existem no banco: Problema do worker');
  console.log('• Se APIs retornam dados mas frontend não mostra: Problema de frontend');
  console.log('• Se configuração de paridades está diferente: Problema de deploy');
  console.log('\n💡 PRÓXIMAS AÇÕES:');
  console.log('1. Verificar se o worker está monitorando as paridades corretas');
  console.log('2. Verificar se há diferença na configuração entre local e deploy');
  console.log('3. Verificar logs específicos do worker no Render');
  console.log('4. Forçar um novo deploy se necessário');
}

deepDeployDiagnosis(); 