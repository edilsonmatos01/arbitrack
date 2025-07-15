const fetch = require('node-fetch');

async function testSpreadAPI() {
  try {
    console.log('Testando API Spread 24h para WHITE_USDT...');
    
    const response = await fetch('http://localhost:3000/api/spread-history/24h/WHITE_USDT');
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Total de pontos: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\nPrimeiros 3 pontos:');
      data.slice(0, 3).forEach((point, index) => {
        console.log(`${index + 1}. ${point.timestamp} - Spread: ${point.spread_percentage}%`);
      });
      
      console.log('\nÚltimos 3 pontos:');
      data.slice(-3).forEach((point, index) => {
        console.log(`${index + 1}. ${point.timestamp} - Spread: ${point.spread_percentage}%`);
      });
    } else {
      console.log('Nenhum dado retornado');
    }
    
  } catch (error) {
    console.error('Erro ao testar API:', error);
  }
}

testSpreadAPI(); 