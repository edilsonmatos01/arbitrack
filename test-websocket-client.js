const WebSocket = require('ws');

console.log('🧪 Testando cliente WebSocket...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conexão WebSocket estabelecida!');
  
  // Enviar mensagem de teste
  const testMessage = {
    type: 'test',
    message: 'Teste de conexão WebSocket',
    timestamp: new Date().toISOString()
  };
  
  ws.send(JSON.stringify(testMessage));
  console.log('📤 Mensagem de teste enviada');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Mensagem recebida:', message);
    
    if (message.type === 'connection') {
      console.log('✅ Servidor WebSocket funcionando corretamente!');
    }
  } catch (error) {
    console.log('📨 Mensagem recebida (raw):', data.toString());
  }
});

ws.on('close', (code, reason) => {
  console.log(`❌ Conexão fechada - Código: ${code}, Razão: ${reason}`);
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão WebSocket:', error.message);
});

// Encerrar após 5 segundos
setTimeout(() => {
  console.log('🛑 Encerrando teste...');
  ws.close();
  process.exit(0);
}, 5000); 