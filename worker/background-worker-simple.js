// WORKER SIMPLIFICADO EM JAVASCRIPT PURO
// Esta versão evita problemas de compilação TypeScript/Prisma

const WebSocket = require('ws');
const http = require('http');

console.log('🚀 Iniciando worker simplificado...');

// Configurações
const PORT = process.env.PORT || 10000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Dados simulados para teste
const mockData = {
  WHITE_USDT: { spot: 1.25, futures: 1.28 },
  BTC_USDT: { spot: 45000, futures: 45100 },
  ETH_USDT: { spot: 2800, futures: 2810 }
};

// Servidor HTTP
const server = http.createServer((req, res) => {
  // CORS headers
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
      clients: connectedClients.length,
      message: 'Worker simplificado funcionando'
    }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

// WebSocket Server
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false,
  clientTracking: true
});

let connectedClients = [];

wss.on('connection', (ws, request) => {
  console.log(`🔌 Nova conexão WebSocket de ${request.socket.remoteAddress}`);
  connectedClients.push(ws);
  
  // Mensagem de boas-vindas
  ws.send(JSON.stringify({ 
    type: 'connection', 
    message: 'Conectado ao worker simplificado',
    timestamp: new Date().toISOString()
  }));
  
  console.log(`✅ Cliente conectado. Total: ${connectedClients.length}`);
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Cliente desconectado. Código: ${code}, Razão: ${reason}`);
    connectedClients = connectedClients.filter((c) => c !== ws);
    console.log(`📊 Total de clientes restantes: ${connectedClients.length}`);
  });
  
  ws.on('error', (error) => {
    console.error(`❌ Erro no WebSocket do cliente:`, error);
    connectedClients = connectedClients.filter((c) => c !== ws);
  });
});

// Função para enviar dados simulados
function broadcastMockData() {
  if (connectedClients.length === 0) {
    console.log('📊 Nenhum cliente conectado');
    return;
  }
  
  // Simular dados de arbitragem
  const symbols = Object.keys(mockData);
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  const data = mockData[randomSymbol];
  
  const opportunity = {
    type: 'arbitrage',
    baseSymbol: randomSymbol,
    profitPercentage: ((data.futures - data.spot) / data.spot * 100).toFixed(4),
    buyAt: {
      exchange: 'gateio',
      price: data.spot,
      marketType: 'spot'
    },
    sellAt: {
      exchange: 'mexc',
      price: data.futures,
      marketType: 'futures'
    },
    arbitrageType: 'spot-to-futures',
    timestamp: Date.now()
  };
  
  const message = JSON.stringify(opportunity);
  
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  console.log(`📤 Enviado: ${randomSymbol} - Spread: ${opportunity.profitPercentage}%`);
}

// Iniciar servidor
server.listen(PORT, HOSTNAME, () => {
  console.log(`✅ Worker simplificado rodando na porta ${PORT} no host ${HOSTNAME}`);
  console.log(`⏱️ Iniciado em: ${new Date().toISOString()}`);
  console.log(`🔗 URL: ws://${HOSTNAME}:${PORT}`);
  console.log(`🌐 Health check: http://${HOSTNAME}:${PORT}/health`);
});

// Enviar dados a cada 5 segundos
setInterval(broadcastMockData, 5000);

// Log inicial
console.log('📊 Enviando dados simulados a cada 5 segundos...');

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando...');
  process.exit(0);
});

console.log('✅ Worker simplificado iniciado com sucesso!'); 