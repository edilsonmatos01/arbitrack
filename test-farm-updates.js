const WebSocket = require('ws');

console.log('🔌 Testando atualizações do FARM...');

const ws = new WebSocket('ws://localhost:10000');

let farmUpdates = 0;
let lastFarmSpot = null;
let lastFarmFutures = null;

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  console.log('📊 Monitorando atualizações do FARM...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'price-update' && message.symbol === 'FARM_USDT') {
      farmUpdates++;
      
      if (message.marketType === 'spot') {
        lastFarmSpot = { ask: message.bestAsk, bid: message.bestBid };
        console.log(`💰 FARM Spot #${farmUpdates}: Ask=${message.bestAsk}, Bid=${message.bestBid}`);
      } else if (message.marketType === 'futures') {
        lastFarmFutures = { ask: message.bestAsk, bid: message.bestBid };
        console.log(`💰 FARM Futures #${farmUpdates}: Ask=${message.bestAsk}, Bid=${message.bestBid}`);
      }
      
      // Mostrar spread se temos ambos os dados
      if (lastFarmSpot && lastFarmFutures) {
        const spotPrice = (lastFarmSpot.ask + lastFarmSpot.bid) / 2;
        const futuresPrice = (lastFarmFutures.ask + lastFarmFutures.bid) / 2;
        const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
        console.log(`📊 FARM Spread: ${spread.toFixed(4)}% (Spot: ${spotPrice.toFixed(4)}, Futures: ${futuresPrice.toFixed(4)})`);
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
  console.log(`📊 Total de atualizações do FARM: ${farmUpdates}`);
  if (lastFarmSpot) {
    console.log(`📈 Último FARM Spot: Ask=${lastFarmSpot.ask}, Bid=${lastFarmSpot.bid}`);
  }
  if (lastFarmFutures) {
    console.log(`📈 Último FARM Futures: Ask=${lastFarmFutures.ask}, Bid=${lastFarmFutures.bid}`);
  }
  ws.close();
  process.exit(0);
}, 30000); 