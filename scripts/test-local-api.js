const http = require('http');

console.log('🔍 Testando API init-data-simple na porta 3001...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/init-data-simple',
  method: 'GET',
  timeout: 10000,
  headers: {
    'User-Agent': 'Node.js Test'
  }
};

const req = http.request(options, (res) => {
  console.log(`📋 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📋 Resposta (primeiros 500 chars):', data.substring(0, 500));
    try {
      const jsonData = JSON.parse(data);
      console.log('📋 Dados parseados com sucesso!');
      
      if (jsonData.spreads && jsonData.spreads.data) {
        const spreads = jsonData.spreads.data;
        const symbols = Object.keys(spreads);
        console.log(`✅ API retornou dados de spread para ${symbols.length} símbolos!`);
        
        // Mostrar alguns exemplos de spreads máximos
        const examples = symbols.slice(0, 5).map(symbol => ({
          symbol,
          spMax: spreads[symbol].spMax,
          crosses: spreads[symbol].crosses
        }));
        
        console.log('📊 Exemplos de spreads máximos:', examples);
      } else {
        console.log('⚠️ API não retornou dados de spread na estrutura esperada');
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