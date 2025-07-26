const WebSocket = require('ws');

console.log('🧪 SIMULANDO DADOS REAIS DAS EXCHANGES');
console.log('======================================');

// Conectar ao worker
const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao worker!');
  
  // Simular dados do Gate.io Spot
  const gateioData = {
    type: 'gateio-spot',
    symbol: 'BTC_USDT',
    data: {
      bestAsk: 118900.0,  // Preço de compra no spot
      bestBid: 118899.0,
      timestamp: Date.now()
    }
  };
  
  // Simular dados do MEXC Futures
  const mexcData = {
    type: 'mexc-futures',
    symbol: 'BTC_USDT',
    data: {
      bestAsk: 119000.0,  // Preço de venda no futures (mais alto)
      bestBid: 118999.0,
      timestamp: Date.now()
    }
  };
  
  console.log('📤 Enviando dados Gate.io Spot:', gateioData);
  ws.send(JSON.stringify(gateioData));
  
  setTimeout(() => {
    console.log('📤 Enviando dados MEXC Futures:', mexcData);
    ws.send(JSON.stringify(mexcData));
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 Mensagem recebida:', message);
    
    if (message.type === 'arbitrage' || message.type === 'opportunity') {
      console.log('🎯 OPORTUNIDADE DETECTADA!');
      console.log('Spread:', message.profitPercentage || message.spread);
    }
  } catch (error) {
    console.log('📨 Dados recebidos (não JSON):', data.toString());
  }
});

ws.on('error', (error) => {
  console.log('❌ Erro na conexão:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Conexão fechada: ${code} - ${reason}`);
});

// Timeout para fechar
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  console.log('⏰ Simulação concluída');
}, 15000); 