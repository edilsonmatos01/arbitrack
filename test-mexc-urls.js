const WebSocket = require('ws');

const urls = [
  'wss://contract.mexc.com/ws',
  'wss://contract.mexc.com/edge',
  'wss://contract.mexc.com/stream',
  'wss://contract.mexc.com/api/ws',
  'wss://futures.mexc.com/ws',
  'wss://futures.mexc.com/edge'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\n🔌 Testando: ${url}`);
    
    const ws = new WebSocket(url);
    
    const timeout = setTimeout(() => {
      console.log(`⏰ Timeout para ${url}`);
      ws.close();
      resolve({ url, success: false, error: 'timeout' });
    }, 5000);
    
    ws.on('open', () => {
      console.log(`✅ Conectado: ${url}`);
      clearTimeout(timeout);
      ws.close();
      resolve({ url, success: true });
    });
    
    ws.on('error', (error) => {
      console.log(`❌ Erro: ${url} - ${error.message}`);
      clearTimeout(timeout);
      resolve({ url, success: false, error: error.message });
    });
  });
}

async function testAllUrls() {
  console.log('🔍 Testando URLs do MEXC Futures...');
  
  for (const url of urls) {
    const result = await testUrl(url);
    if (result.success) {
      console.log(`🎉 URL FUNCIONANDO: ${result.url}`);
    }
  }
  
  console.log('\n✅ Teste concluído!');
}

testAllUrls(); 