const http = require('http');

function checkServer() {
  console.log('Verificando servidor na porta 10000...');
  
  const options = {
    hostname: 'localhost',
    port: 10000,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Resposta:', data);
      
      // Testar a API all-data
      testAllDataAPI();
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
  });

  req.end();
}

function testAllDataAPI() {
  console.log('\nTestando API all-data...');
  
  const options = {
    hostname: 'localhost',
    port: 10000,
    path: '/api/arbitrage/all-data',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ API all-data funcionando');
          console.log('📊 Dados recebidos:', {
            hasMaxSpreads: !!jsonData.maxSpreads,
            maxSpreadsCount: Object.keys(jsonData.maxSpreads || {}).length,
            timestamp: jsonData.timestamp
          });
          
          // Verificar alguns símbolos
          const symbols = ['ERA_USDT', 'WHITE_USDT', 'NAM_USDT'];
          symbols.forEach(symbol => {
            const maxSpread = jsonData.maxSpreads?.[symbol];
            if (maxSpread) {
              console.log(`${symbol}: ${maxSpread.spMax?.toFixed(2)}% (${maxSpread.crosses} registros)`);
            } else {
              console.log(`${symbol}: N/D`);
            }
          });
        } catch (e) {
          console.error('❌ Erro ao parsear JSON:', e.message);
          console.log('Resposta bruta:', data.substring(0, 200) + '...');
        }
      } else {
        console.error(`❌ Erro na API: ${res.statusCode}`);
        console.log('Resposta:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Erro na requisição all-data: ${e.message}`);
  });

  req.end();
}

checkServer(); 