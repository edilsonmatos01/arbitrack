const WebSocket = require('ws');

console.log('🔍 Testando conexão WebSocket no Render...');

// Testar conexão no Render
const ws = new WebSocket('wss://arbitrage-worker.onrender.com');

ws.on('open', () => {
  console.log('✅ Conexão WebSocket no Render estabelecida!');
  
  // Enviar mensagem de teste
  ws.send(JSON.stringify({ type: 'test', message: 'Teste de conexão Render' }));
});

ws.on('message', (data) => {
  console.log('📨 Mensagem recebida do Render:', data.toString());
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão WebSocket no Render:', error);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Conexão WebSocket no Render fechada: ${code} - ${reason}`);
});

// Aguardar 10 segundos e encerrar
setTimeout(() => {
  console.log('⏰ Encerrando teste...');
  ws.close();
  process.exit(0);
}, 10000); 