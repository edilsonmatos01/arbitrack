const WebSocket = require('ws');
const http = require('http');

console.log('🧪 WORKER SIMPLIFICADO - TESTE');
console.log('==============================');

// Servidor HTTP simples
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'Worker ativo',
    timestamp: new Date().toISOString(),
    message: 'Servidor worker funcionando corretamente'
  }));
});

// Servidor WebSocket
const wss = new WebSocket.Server({ server });
const connectedClients = [];

wss.on('connection', (ws) => {
  console.log('✅ Cliente WebSocket conectado!');
  connectedClients.push(ws);
  
  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Conectado ao servidor de arbitragem em tempo real',
    timestamp: new Date().toISOString()
  }));
  
  // Simular uma oportunidade de arbitragem a cada 5 segundos
  const interval = setInterval(() => {
    const opportunity = {
      type: 'arbitrage',
      baseSymbol: 'BTC',
      profitPercentage: 0.15,
      buyAt: {
        exchange: 'gateio',
        price: 45000.50,
        marketType: 'spot'
      },
      sellAt: {
        exchange: 'mexc',
        price: 45067.75,
        marketType: 'futures'
      },
      arbitrageType: 'spot_to_futures',
      timestamp: Date.now()
    };
    
    console.log('🎯 Enviando oportunidade simulada:', opportunity.baseSymbol);
    ws.send(JSON.stringify(opportunity));
  }, 5000);
  
  ws.on('close', () => {
    console.log('🔌 Cliente desconectado');
    clearInterval(interval);
    const index = connectedClients.indexOf(ws);
    if (index > -1) {
      connectedClients.splice(index, 1);
    }
  });
});

// Iniciar servidor na porta 10000
server.listen(10000, () => {
  console.log('✅ Servidor WebSocket rodando na porta 10000');
  console.log('🌐 WebSocket disponível em ws://localhost:10000');
  console.log('📡 HTTP disponível em http://localhost:10000');
});

// Tratamento de encerramento
process.on('SIGINT', () => {
  console.log('\n🔌 Encerrando worker...');
  server.close();
  process.exit(0);
}); 