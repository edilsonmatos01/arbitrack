// WORKER COMO SERVIÇO WEB - COMPATÍVEL COM RENDER
const WebSocket = require('ws');
const http = require('http');

console.log('🚀 Worker Web iniciando...');
console.log('📅 Timestamp:', new Date().toISOString());

const PORT = process.env.PORT || 10000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`📡 HTTP: ${req.method} ${req.url}`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Worker Web funcionando',
      clients: connectedClients.length
    }));
    return;
  }
  
  // Root endpoint
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head><title>Worker WebSocket</title></head>
        <body>
          <h1>Worker WebSocket Funcionando!</h1>
          <p>Status: Ativo</p>
          <p>Clientes conectados: ${connectedClients.length}</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </body>
      </html>
    `);
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

// WebSocket Server
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false
});

let connectedClients = [];

wss.on('connection', (ws, request) => {
  console.log(`🔌 Nova conexão WebSocket!`);
  connectedClients.push(ws);
  
  // Mensagem de boas-vindas
  ws.send(JSON.stringify({ 
    type: 'connection', 
    message: 'Conectado ao Worker Web',
    timestamp: new Date().toISOString()
  }));
  
  console.log(`✅ Cliente conectado. Total: ${connectedClients.length}`);
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Cliente desconectado. Código: ${code}`);
    connectedClients = connectedClients.filter((c) => c !== ws);
    console.log(`📊 Clientes restantes: ${connectedClients.length}`);
  });
  
  ws.on('error', (error) => {
    console.error(`❌ Erro no WebSocket:`, error.message);
    connectedClients = connectedClients.filter((c) => c !== ws);
  });
});

// Dados simulados
function sendMockData() {
  if (connectedClients.length === 0) {
    console.log('📊 Nenhum cliente conectado');
    return;
  }
  
  const data = {
    type: 'arbitrage',
    symbol: 'BTC_USDT',
    profit: '0.85',
    timestamp: new Date().toISOString()
  };
  
  const message = JSON.stringify(data);
  
  connectedClients.forEach((client, index) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      console.log(`📤 Dados enviados para cliente ${index + 1}`);
    }
  });
}

// Iniciar servidor
server.listen(PORT, HOSTNAME, () => {
  console.log(`✅ Worker Web rodando!`);
  console.log(`🔗 URL: http://${HOSTNAME}:${PORT}`);
  console.log(`🔌 WebSocket: ws://${HOSTNAME}:${PORT}`);
  console.log(`🏥 Health: http://${HOSTNAME}:${PORT}/health`);
  console.log(`⏱️ Iniciado em: ${new Date().toISOString()}`);
});

// Enviar dados a cada 5 segundos
setInterval(sendMockData, 5000);
console.log('📊 Enviando dados simulados a cada 5 segundos...');

// Tratamento de shutdown
process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

console.log('✅ Worker Web pronto!'); 