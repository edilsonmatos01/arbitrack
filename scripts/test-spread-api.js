const https = require('https');

console.log('🔍 Testando API de spread máximo...');

const options = {
  hostname: 'robo-de-arbitragem-tracker.onrender.com',
  port: 443,
  path: '/api/spreads/max',
  method: 'GET',
  timeout: 10000,
  headers: {
    'User-Agent': 'Node.js Test'
  }
};

const req = https.request(options, (res) => {
  console.log(`📋 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📋 Resposta:', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('📋 Dados parseados:', jsonData);
      
      if (jsonData.spreads && jsonData.spreads.length > 0) {
        console.log('✅ API retornou dados de spread!');
        console.log('📊 Primeiros 3 spreads:', jsonData.spreads.slice(0, 3));
      } else {
        console.log('⚠️ API não retornou dados de spread');
      }
    } catch (e) {
      console.log('📋 Resposta não é JSON válido');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.on('timeout', () => {
  console.error('❌ Timeout na requisição');
  req.destroy();
});

req.end(); 