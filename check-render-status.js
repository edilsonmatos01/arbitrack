const https = require('https');

console.log('🔍 Verificando status dos serviços no Render...\n');

// Função para fazer requisição HTTPS
function makeRequest(url, description) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${description}:`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
        console.log(`   Response: ${data.substring(0, 200)}...`);
        console.log('');
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}:`);
      console.log(`   Erro: ${error.message}`);
      console.log('');
      resolve({ status: 'ERROR', error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ ${description}: Timeout após 10 segundos`);
      console.log('');
      req.destroy();
      resolve({ status: 'TIMEOUT' });
    });
  });
}

async function checkServices() {
  console.log('📋 Verificando serviços...\n');

  // Verificar web service
  await makeRequest(
    'https://robo-de-arbitragem-5n8k.onrender.com',
    'Web Service (robo-de-arbitragem)'
  );

  // Verificar worker service
  await makeRequest(
    'https://arbitrage-worker.onrender.com',
    'Worker Service (arbitrage-worker)'
  );

  // Verificar health endpoint do worker
  await makeRequest(
    'https://arbitrage-worker.onrender.com/health',
    'Worker Health Endpoint'
  );

  console.log('🎯 DIAGNÓSTICO:');
  console.log('1. Se o Web Service retorna 200: ✅ OK');
  console.log('2. Se o Worker Service retorna 404: ❌ Worker não está rodando');
  console.log('3. Se o Health Endpoint retorna 404: ❌ Worker não iniciou corretamente');
  console.log('');
  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('- Verificar logs do worker no Render Dashboard');
  console.log('- Verificar se o build do worker está falhando');
  console.log('- Verificar se as variáveis de ambiente estão corretas');
}

checkServices().catch(console.error); 