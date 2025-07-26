const fetch = require('node-fetch');

async function testInitDataFix() {
  console.log('🧪 TESTANDO CORREÇÃO DA API INIT-DATA-SIMPLE');
  console.log('============================================\n');
  
  const localUrl = 'http://localhost:3000';
  const renderUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  
  const testPairs = ['VANRY_USDT', 'EPIC_USDT', 'DEVVE_USDT'];
  
  // Testar versão local
  console.log('1️⃣ TESTANDO VERSÃO LOCAL:');
  console.log('--------------------------');
  
  try {
    const response = await fetch(`${localUrl}/api/init-data-simple`);
    if (response.ok) {
      const data = await response.json();
      const spreads = data.spreads?.data || {};
      
      console.log(`   📊 Total de spreads: ${Object.keys(spreads).length}`);
      
      for (const pair of testPairs) {
        if (spreads[pair]) {
          console.log(`   ✅ ${pair}: ${spreads[pair].spMax}% (${spreads[pair].crosses} cruzamentos)`);
        } else {
          console.log(`   ❌ ${pair}: Não encontrado`);
        }
      }
    } else {
      console.log(`   ❌ Erro: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   💥 Erro de conexão: ${error.message}`);
  }
  
  // Testar versão deployada (antes da correção)
  console.log('\n2️⃣ TESTANDO VERSÃO DEPLOYADA (ANTES DA CORREÇÃO):');
  console.log('--------------------------------------------------');
  
  try {
    const response = await fetch(`${renderUrl}/api/init-data-simple`);
    if (response.ok) {
      const data = await response.json();
      const spreads = data.spreads?.data || {};
      
      console.log(`   📊 Total de spreads: ${Object.keys(spreads).length}`);
      
      for (const pair of testPairs) {
        if (spreads[pair]) {
          console.log(`   ✅ ${pair}: ${spreads[pair].spMax}% (${spreads[pair].crosses} cruzamentos)`);
        } else {
          console.log(`   ❌ ${pair}: Não encontrado`);
        }
      }
    } else {
      console.log(`   ❌ Erro: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   💥 Erro de conexão: ${error.message}`);
  }
  
  // Verificar se COMMON_PAIRS inclui as paridades
  console.log('\n3️⃣ VERIFICANDO COMMON_PAIRS:');
  console.log('----------------------------');
  
  try {
    const { COMMON_PAIRS } = require('./lib/predefined-pairs');
    
    console.log(`   📊 Total de pares em COMMON_PAIRS: ${COMMON_PAIRS.length}`);
    
    for (const pair of testPairs) {
      if (COMMON_PAIRS.includes(pair)) {
        console.log(`   ✅ ${pair}: Presente em COMMON_PAIRS`);
      } else {
        console.log(`   ❌ ${pair}: Ausente de COMMON_PAIRS`);
      }
    }
    
    // Mostrar algumas paridades que estão em COMMON_PAIRS
    const samplePairs = COMMON_PAIRS.slice(0, 10);
    console.log(`   📝 Exemplos de pares em COMMON_PAIRS: ${samplePairs.join(', ')}`);
    
  } catch (error) {
    console.log(`   💥 Erro ao carregar COMMON_PAIRS: ${error.message}`);
  }
  
  // Resumo
  console.log('\n📋 RESUMO:');
  console.log('==========');
  console.log('• Se local funciona mas deploy não: Problema de deploy');
  console.log('• Se ambos não funcionam: Problema de código');
  console.log('• Se COMMON_PAIRS não inclui as paridades: Problema de configuração');
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Fazer commit da correção');
  console.log('2. Fazer push para o repositório');
  console.log('3. Aguardar deploy automático no Render');
  console.log('4. Testar novamente após deploy');
}

testInitDataFix(); 