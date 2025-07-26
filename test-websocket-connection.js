const WebSocket = require('ws');

console.log('🧪 Testando conexão WebSocket...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao servidor WebSocket!');
  
  // Enviar mensagem de identificação
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'test-client',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 Mensagem recebida:', message.type, message);
    
    if (message.type === 'arbitrage') {
      console.log('🎯 OPORTUNIDADE ENCONTRADA:', message);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error);
});

ws.on('close', (code, reason) => {
  console.log('🔌 Conexão fechada:', code, reason);
});

// Aguardar 30 segundos e fechar
setTimeout(() => {
  console.log('⏰ Teste concluído, fechando conexão...');
  ws.close();
  process.exit(0);
}, 30000); 