const https = require('https');

console.log('🔍 Testando API de health na porta 3000...');

const options = {
  hostname: 'robo-de-arbitragem-tracker.onrender.com',
  port: 3000,
  path: '/api/health',
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