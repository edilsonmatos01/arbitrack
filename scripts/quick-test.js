const http = require('http');

function testApi() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/init-data-simple?user_id=edilsonmatos', (res) => {
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
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  try {
    console.log('🔍 Testando API...');
    const data = await testApi();
    
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

main(); 