const WebSocket = require('ws');

console.log('🔍 Testando conexão WebSocket local...');

// Testar conexão local
const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conexão WebSocket local estabelecida!');
  
  // Enviar mensagem de teste
  ws.send(JSON.stringify({ type: 'test', message: 'Teste de conexão' }));
});

ws.on('message', (data) => {
  console.log('📨 Mensagem recebida:', data.toString());
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão WebSocket local:', error);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Conexão WebSocket fechada: ${code} - ${reason}`);
});

// Aguardar 10 segundos e encerrar
setTimeout(() => {
  console.log('⏰ Encerrando teste...');
  ws.close();
  process.exit(0);
}, 10000); 