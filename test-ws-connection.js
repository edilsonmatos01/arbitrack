const WebSocket = require('ws');

console.log('🔌 Testando conexão WebSocket na porta 10000...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado com sucesso ao WebSocket!');
  
  // Enviar mensagem de teste
  ws.send(JSON.stringify({
    type: 'test',
    message: 'Teste de conexão',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Mensagem recebida:', message);
  } catch (error) {
    console.log('📨 Mensagem raw:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

ws.on('close', (code, reason) => {
  console.log('🔌 Conexão fechada:', code, reason?.toString());
});

// Fechar após 10 segundos
setTimeout(() => {
  console.log('⏰ Fechando conexão de teste...');
  ws.close();
  process.exit(0);
}, 10000); 