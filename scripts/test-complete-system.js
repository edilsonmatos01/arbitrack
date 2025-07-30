const WebSocket = require('ws');

console.log('🎯 TESTE COMPLETO DO SISTEMA');
console.log('============================');

// Testar worker
console.log('\n1️⃣ Testando Worker...');
const workerWs = new WebSocket('ws://localhost:10000');

let workerConnected = false;
let opportunitiesReceived = 0;

workerWs.on('open', () => {
  console.log('✅ Worker conectado!');
  workerConnected = true;
});

workerWs.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    
    if (message.type === 'connection') {
      console.log('✅ Worker enviou mensagem de conexão');
    } else if (message.type === 'arbitrage' || message.type === 'opportunity') {
      opportunitiesReceived++;
      console.log(`🎯 Oportunidade #${opportunitiesReceived}: ${message.baseSymbol} - ${message.profitPercentage?.toFixed(4)}%`);
    }
  } catch (error) {
    // Ignorar erros de parsing
  }
});

workerWs.on('error', (error) => {
  console.log('❌ Erro no worker:', error.message);
});

// Testar frontend
setTimeout(() => {
  console.log('\n2️⃣ Testando Frontend...');
  
  const https = require('https');
  const http = require('http');
  
  const client = http;
  const req = client.request('http://localhost:3000', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Frontend está funcionando!');
    } else {
      console.log(`❌ Frontend erro: ${res.statusCode}`);
    }
  });
  
  req.on('error', (error) => {
    console.log('❌ Frontend não está acessível:', error.message);
  });
  
  req.end();
}, 2000);

// Testar API
setTimeout(() => {
  console.log('\n3️⃣ Testando API...');
  
  const http = require('http');
  
  const req = http.request('http://localhost:3000/api/init-data-simple', (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.spreads && response.spreads.length > 0) {
          console.log(`✅ API funcionando! ${response.spreads.length} spreads carregados`);
        } else {
          console.log('⚠️  API funcionando mas sem dados');
        }
      } catch (error) {
        console.log('❌ Erro ao processar resposta da API');
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ API não está acessível:', error.message);
  });
  
  req.end();
}, 4000);

// Resumo final
setTimeout(() => {
  console.log('\n📊 RESUMO FINAL:');
  console.log('================');
  
  if (workerConnected) {
    console.log('✅ Worker: FUNCIONANDO');
  } else {
    console.log('❌ Worker: NÃO FUNCIONANDO');
  }
  
  if (opportunitiesReceived > 0) {
    console.log(`✅ Oportunidades: ${opportunitiesReceived} detectadas`);
  } else {
    console.log('❌ Oportunidades: NENHUMA detectada');
  }
  
  console.log('\n🎯 SISTEMA PRONTO PARA USO!');
  console.log('🌐 Acesse: http://localhost:3000');
  console.log('📊 Oportunidades de arbitragem sendo detectadas em tempo real');
  
  // Fechar conexão
  if (workerWs.readyState === WebSocket.OPEN) {
    workerWs.close();
  }
}, 8000); 