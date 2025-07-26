const WebSocket = require('ws');

console.log('🧪 TESTE - CONEXÃO MEXC FUTURES');
console.log('================================');

const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';

console.log(`🌐 Tentando conectar em: ${MEXC_FUTURES_WS_URL}`);

const ws = new WebSocket(MEXC_FUTURES_WS_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  handshakeTimeout: 30000
});

let messagesReceived = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao MEXC Futures WebSocket!');
  
  // Enviar subscrição para alguns pares
  const pairs = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];
  
  pairs.forEach(pair => {
    const message = {
      method: "SUBSCRIPTION",
      params: [`contract.kline.${pair}.1m`]
    };
    
    console.log(`📤 Enviando subscrição para ${pair}:`, JSON.stringify(message));
    ws.send(JSON.stringify(message));
  });
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    messagesReceived++;
    
    console.log(`📨 Mensagem #${messagesReceived}:`, JSON.stringify(message, null, 2));
    
    if (messagesReceived >= 5) {
      console.log('✅ Recebidas 5 mensagens, teste concluído com sucesso!');
      ws.close();
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão MEXC Futures:', error.message);
});

ws.on('close', (event) => {
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n🔌 Conexão fechada após ${duration.toFixed(1)}s`);
  console.log(`📊 Total de mensagens recebidas: ${messagesReceived}`);
  
  if (messagesReceived === 0) {
    console.log('\n⚠️  PROBLEMA: Nenhuma mensagem recebida');
    console.log('   - Verificar se a URL está correta');
    console.log('   - Verificar se há firewall bloqueando');
  } else {
    console.log('\n✅ SUCESSO: MEXC Futures WebSocket funcionando!');
  }
});

// Aguardar 30 segundos
setTimeout(() => {
  console.log('\n⏰ Tempo limite atingido (30s)');
  ws.close();
}, 30000); 