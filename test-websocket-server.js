const WebSocket = require('ws');
const http = require('http');

console.log('🧪 Testando servidor WebSocket na porta 10000...');

// Criar servidor HTTP simples
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok', 
    message: 'Servidor WebSocket funcionando',
    timestamp: new Date().toISOString()
  }));
});

// Criar servidor WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('✅ Cliente WebSocket conectado:', req.socket.remoteAddress);
  
  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Servidor WebSocket funcionando corretamente',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('message', (data) => {
    console.log('📨 Mensagem recebida:', data.toString());
    // Echo da mensagem
    ws.send(JSON.stringify({
      type: 'echo',
      data: data.toString(),
      timestamp: new Date().toISOString()
    }));
  });
  
  ws.on('close', () => {
    console.log('❌ Cliente WebSocket desconectado');
  });
  
  ws.on('error', (error) => {
    console.error('❌ Erro no WebSocket:', error);
  });
});

// Iniciar servidor
const PORT = 10000;
server.listen(PORT, () => {
  console.log(`✅ Servidor WebSocket rodando na porta ${PORT}`);
  console.log(`🌐 WebSocket disponível em ws://localhost:${PORT}`);
  console.log(`📡 HTTP disponível em http://localhost:${PORT}`);
  console.log('🧪 Teste com: node test-websocket-client.js');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
}); 