// WORKER MINIMALISTA - MÁXIMA COMPATIBILIDADE
const WebSocket = require('ws');
const http = require('http');

console.log('🚀 Worker minimalista iniciando...');

const PORT = process.env.PORT || 10000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Servidor HTTP
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Worker funcionando!');
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

// WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Cliente conectado');
  
  ws.send(JSON.stringify({ 
    type: 'connection', 
    message: 'Conectado',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

// Dados simulados
setInterval(() => {
  const data = {
    type: 'arbitrage',
    symbol: 'BTC_USDT',
    profit: '0.85',
    timestamp: new Date().toISOString()
  };
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}, 5000);

// Iniciar
server.listen(PORT, HOSTNAME, () => {
  console.log(`✅ Worker rodando em http://${HOSTNAME}:${PORT}`);
  console.log(`🔌 WebSocket: ws://${HOSTNAME}:${PORT}`);
});

console.log('✅ Worker minimalista pronto!'); 