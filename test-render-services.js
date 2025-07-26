const https = require('https');

// Lista de possíveis URLs dos serviços
const services = [
  'https://arbitrage-worker.onrender.com',
  'https://arbitragem-render.onrender.com',
  'https://robo-de-arbitragem.onrender.com',
  'https://robo-de-arbitragem-tracker.onrender.com'
];

// Função para testar um serviço
function testService(url) {
  return new Promise((resolve) => {
    const req = https.get(url + '/health', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            url,
            status: res.statusCode,
            data: json,
            success: true
          });
        } catch (e) {
          resolve({
            url,
            status: res.statusCode,
            data: data,
            success: false
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        error: err.message,
        success: false
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        error: 'Timeout',
        success: false
      });
    });
  });
}

// Testar todos os serviços
async function testAllServices() {
  console.log('🔍 Testando todos os serviços na Render...\n');
  
  for (const service of services) {
    console.log(`📡 Testando: ${service}`);
    const result = await testService(service);
    
    if (result.success) {
      console.log(`✅ ${service} - Status: ${result.status}`);
      if (result.data) {
        console.log(`📊 Dados:`, JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log(`❌ ${service} - Erro: ${result.error || result.status}`);
    }
    console.log('');
  }
}

testAllServices(); 