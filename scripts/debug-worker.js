const WebSocket = require('ws');

console.log('🔍 Debugando worker...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao worker!');
  console.log('📡 Monitorando por 60 segundos...');
});

ws.on('message', (data) => {
  messageCount++;
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      console.log(`📨 Oportunidade #${messageCount}: ${message.baseSymbol} - ${message.profitPercentage.toFixed(4)}%`);
      
      // Verificar se a oportunidade tem dados válidos para salvar
      if (message.buyAt && message.sellAt && 
          message.buyAt.price > 0 && message.sellAt.price > 0) {
        console.log(`  ✅ Dados válidos para salvar: Spot=${message.buyAt.price}, Futures=${message.sellAt.price}`);
      } else {
        console.log(`  ❌ Dados inválidos: Spot=${message.buyAt?.price}, Futures=${message.sellAt?.price}`);
      }
    } else if (message.type === 'heartbeat') {
      console.log(`💓 Heartbeat: ${message.message}`);
    }
  } catch (error) {
    console.log(`📨 Erro ao processar mensagem #${messageCount}:`, error.message);
  }
});

ws.on('error', (error) => {
  console.log('❌ Erro na conexão:', error.message);
});

ws.on('close', (code, reason) => {
  const duration = (Date.now() - startTime) / 1000;
  console.log(`🔌 Conexão fechada após ${duration}s: ${code} - ${reason}`);
  console.log(`📊 Total de mensagens recebidas: ${messageCount}`);
});

// Timeout para fechar
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  console.log('⏰ Debug concluído');
}, 60000); 