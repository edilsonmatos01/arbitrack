// Script para testar a API de spread history diretamente
const fetch = require('node-fetch');

async function testAPI() {
  console.log('=== TESTE DIRETO DA API ===');
  
  try {
    // Testar a API antiga (problemática)
    console.log('\n1. Testando API antiga (/api/spread-history):');
    const response1 = await fetch('http://localhost:3000/api/spread-history?symbol=WHITE_USDT');
    const data1 = await response1.json();
    
    if (data1.length > 0) {
      console.log('Primeiros 3 registros:');
      data1.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.timestamp} - ${item.spread}%`);
      });
      
      console.log('\nÚltimos 3 registros:');
      data1.slice(-3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.timestamp} - ${item.spread}%`);
      });
    }
    
    // Testar a API nova (corrigida)
    console.log('\n2. Testando API nova (/api/spread-history/24h/WHITE_USDT):');
    const response2 = await fetch('http://localhost:3000/api/spread-history/24h/WHITE_USDT');
    const data2 = await response2.json();
    
    if (data2.length > 0) {
      console.log('Primeiros 3 registros:');
      data2.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.timestamp} - ${item.spread_percentage}%`);
      });
      
      console.log('\nÚltimos 3 registros:');
      data2.slice(-3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.timestamp} - ${item.spread_percentage}%`);
      });
    }
    
    // Testar com refresh forçado
    console.log('\n3. Testando API nova com refresh forçado:');
    const response3 = await fetch('http://localhost:3000/api/spread-history/24h/WHITE_USDT?refresh=true');
    const data3 = await response3.json();
    
    if (data3.length > 0) {
      console.log('Primeiros 3 registros (refresh):');
      data3.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.timestamp} - ${item.spread_percentage}%`);
      });
    }
    
    console.log('\n=== COMPARAÇÃO ===');
    console.log('Se os horários são diferentes entre as APIs, a correção está funcionando.');
    console.log('A API nova deve mostrar horários 3 horas a mais que a antiga.');
    
  } catch (error) {
    console.error('Erro ao testar API:', error);
  }
}

// Executar o teste
testAPI(); 