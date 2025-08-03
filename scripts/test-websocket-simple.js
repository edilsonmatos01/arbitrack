const WebSocket = require('ws');

console.log('🔍 Testando conexão WebSocket simples...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado com sucesso!');
});

ws.on('message', (data) => {
  console.log('📨 Mensagem recebida:', data.toString());
});

ws.on('error', (error) => {
  console.error('❌ Erro:', error.message);
});

ws.on('close', (code, reason) => {
  console.log('🔌 Conexão fechada:', code, reason);
});

setTimeout(() => {
  console.log('⏰ Fechando...');
  ws.close();
  process.exit(0);
}, 10000); 