const fetch = require('node-fetch');

async function testServerStatus() {
  const urls = [
    'https://robo-de-arbitragem-5n8k.onrender.com',
    'https://robo-de-arbitragem-5n8k.onrender.com/api/debug/timezone',
    'https://robo-de-arbitragem-5n8k.onrender.com/health'
  ];

  console.log('🔍 Testando status do servidor...\n');

  for (const url of urls) {
    try {
      console.log(`📡 Testando: ${url}`);
      const response = await fetch(url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`📄 Resposta: ${text.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
    console.log('---');
  }

  console.log('\n🔧 Verificando logs do Render...');
  console.log('📋 Acesse: https://dashboard.render.com/');
  console.log('📋 Procure pelo serviço "robo-de-arbitragem"');
  console.log('📋 Vá na aba "Logs" para ver os erros detalhados');
}

testServerStatus(); 