const http = require('http');

function testAPI() {
  const start = Date.now();
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/init-data-simple?user_id=edilsonmatos',
    method: 'GET',
    timeout: 120000 // 2 minutos
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const end = Date.now();
      const duration = (end - start) / 1000;
      console.log(`\n✅ API respondeu em ${duration.toFixed(2)} segundos`);
      console.log(`📊 Tamanho da resposta: ${(data.length / 1024).toFixed(2)} KB`);
      
      try {
        const json = JSON.parse(data);
        console.log(`📈 Símbolos retornados: ${Object.keys(json.spreads?.data || {}).length}`);
      } catch (e) {
        console.log('❌ Erro ao parsear JSON:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Erro na requisição: ${e.message}`);
  });

  req.on('timeout', () => {
    console.error('⏰ Timeout na requisição');
    req.destroy();
  });

  req.end();
}

console.log('🚀 Testando performance da API...');
testAPI(); 