// Teste da conexão WebSocket na versão deployada
console.log('🧪 Teste da Conexão WebSocket Deployada');

const WebSocket = require('ws');

async function testWebSocketConnection() {
  try {
    console.log('\n1. Testando conexão HTTP...');
    const https = require('https');
    
    const httpResponse = await new Promise((resolve, reject) => {
      const req = https.request('https://robo-de-arbitragem-tracker.onrender.com', { method: 'HEAD' }, (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Timeout HTTP')));
      req.end();
    });
    
    console.log('✅ HTTP Status:', httpResponse.statusCode);
    console.log('📋 Headers:', Object.keys(httpResponse.headers));
    
    console.log('\n2. Testando conexão WebSocket...');
    
    const ws = new WebSocket('wss://robo-de-arbitragem-tracker.onrender.com');
    
    const connectionPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout WebSocket (30s)'));
      }, 30000);
      
      ws.on('open', () => {
        console.log('✅ WebSocket conectado com sucesso!');
        clearTimeout(timeout);
        resolve('connected');
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 Mensagem recebida:', message.type || 'unknown');
        } catch (error) {
          console.log('📨 Mensagem raw:', data.toString().substring(0, 100));
        }
      });
      
      ws.on('error', (error) => {
        console.error('❌ Erro WebSocket:', error.message);
        clearTimeout(timeout);
        reject(error);
      });
      
      ws.on('close', (code, reason) => {
        console.log('🔌 WebSocket fechado:', code, reason?.toString());
        clearTimeout(timeout);
        reject(new Error(`WebSocket fechado: ${code} - ${reason}`));
      });
    });
    
    await connectionPromise;
    
    // Enviar mensagem de teste
    console.log('\n3. Enviando mensagem de teste...');
    ws.send(JSON.stringify({
      type: 'ping',
      timestamp: Date.now()
    }));
    
    // Aguardar um pouco para ver se recebe resposta
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    ws.close();
    console.log('\n✅ Teste WebSocket concluído com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro no teste WebSocket:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('🔍 Possíveis causas:');
      console.log('   - Servidor WebSocket não está rodando');
      console.log('   - Firewall bloqueando conexão');
      console.log('   - Configuração incorreta no Render');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('🔍 Servidor recusou conexão - WebSocket não está ativo');
    }
  }
}

// Executar teste
testWebSocketConnection().then(() => {
  console.log('\n🎯 DIAGNÓSTICO COMPLETO');
  console.log('📱 Verifique se o servidor WebSocket está rodando no Render');
}).catch(() => {
  console.log('\n⚠️ PROBLEMA IDENTIFICADO');
  console.log('🔧 O servidor WebSocket precisa ser verificado/reiniciado');
}); 