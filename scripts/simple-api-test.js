const https = require('https');
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testApi() {
  try {
    console.log('🔍 Testando API...');
    
    const data = await makeRequest('http://localhost:3000/api/init-data-simple?user_id=edilsonmatos');
    
    console.log('✅ API funcionando!');
    console.log(`📊 Total de spreads: ${Object.keys(data.spreads.data).length}`);
    
    // Verificar símbolos específicos
    const symbols = ['VR_USDT', 'VVAIFU_USDT', 'DODO_USDT', 'GORK_USDT'];
    
    symbols.forEach(symbol => {
      const spreadData = data.spreads.data[symbol];
      if (spreadData && spreadData.spMax > 0) {
        console.log(`✅ ${symbol}: ${spreadData.spMax}% (${spreadData.crosses} registros)`);
      } else {
        console.log(`❌ ${symbol}: ${spreadData?.spMax || 0}%`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testApi(); 