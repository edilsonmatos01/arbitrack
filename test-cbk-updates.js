const WebSocket = require('ws');

console.log('🔌 Testando atualizações do CBK...');

const ws = new WebSocket('ws://localhost:10000');

let cbkUpdates = 0;
let lastCbkSpot = null;
let lastCbkFutures = null;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  console.log('📊 Monitorando atualizações do CBK...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update' && message.symbol === 'CBK_USDT') {
      cbkUpdates++;
      
      if (message.marketType === 'spot') {
        lastCbkSpot = { ask: message.bestAsk, bid: message.bestBid };
        console.log(`💰 CBK Spot #${cbkUpdates}: Ask=${message.bestAsk}, Bid=${message.bestBid}`);
      } else if (message.marketType === 'futures') {
        lastCbkFutures = { ask: message.bestAsk, bid: message.bestBid };
        console.log(`💰 CBK Futures #${cbkUpdates}: Ask=${message.bestAsk}, Bid=${message.bestBid}`);
      }
      
      // Mostrar spread se temos ambos os dados
      if (lastCbkSpot && lastCbkFutures) {
        const spotPrice = (lastCbkSpot.ask + lastCbkSpot.bid) / 2;
        const futuresPrice = (lastCbkFutures.ask + lastCbkFutures.bid) / 2;
        const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
        console.log(`📊 CBK Spread: ${spread.toFixed(4)}% (Spot: ${spotPrice.toFixed(4)}, Futures: ${futuresPrice.toFixed(4)})`);
      }
    }
  } catch (error) {
    console.log('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

ws.on('close', (code, reason) => {
  console.log('🔌 Conexão fechada:', code, reason?.toString());
});

// Fechar após 30 segundos
setTimeout(() => {
  console.log('⏰ Fechando conexão de teste...');
  console.log(`📊 Total de atualizações do CBK: ${cbkUpdates}`);
  if (lastCbkSpot) {
    console.log(`📈 Último CBK Spot: Ask=${lastCbkSpot.ask}, Bid=${lastCbkSpot.bid}`);
  }
  if (lastCbkFutures) {
    console.log(`📈 Último CBK Futures: Ask=${lastCbkFutures.ask}, Bid=${lastCbkFutures.bid}`);
  }
  ws.close();
  process.exit(0);
}, 30000); 