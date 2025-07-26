const WebSocket = require('ws');

console.log('🔌 TESTE DIRETO DO WEBSOCKET\n');

// URL do WebSocket do worker
const wsUrl = 'wss://arbitrage-worker.onrender.com';

console.log(`📡 Conectando ao WebSocket: ${wsUrl}`);
console.log('─'.repeat(60));

const ws = new WebSocket(wsUrl);

let messageCount = 0;
let opportunityCount = 0;
let priceUpdateCount = 0;

ws.on('open', () => {
  console.log('✅ WebSocket conectado com sucesso!');
  console.log('📊 Aguardando mensagens...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    messageCount++;
    
    console.log(`📨 Mensagem #${messageCount}:`);
    console.log(`   Tipo: ${message.type}`);
    console.log(`   Timestamp: ${new Date(message.timestamp || Date.now()).toLocaleTimeString()}`);
    
    if (message.type === 'arbitrage' || message.type === 'opportunity') {
      opportunityCount++;
      console.log(`   💰 OPORTUNIDADE #${opportunityCount}:`);
      console.log(`      Símbolo: ${message.baseSymbol || message.symbol}`);
      console.log(`      Spread: ${message.profitPercentage || message.spread}%`);
      console.log(`      Compra: ${message.buyAt?.exchange} - ${message.buyAt?.price}`);
      console.log(`      Venda: ${message.sellAt?.exchange} - ${message.sellAt?.price}`);
    } else if (message.type === 'price-update') {
      priceUpdateCount++;
      if (priceUpdateCount <= 5) { // Mostrar apenas os primeiros 5
        console.log(`   📈 Price Update #${priceUpdateCount}:`);
        console.log(`      Símbolo: ${message.symbol}`);
        console.log(`      Mercado: ${message.marketType}`);
        console.log(`      Ask: ${message.bestAsk}`);
        console.log(`      Bid: ${message.bestBid}`);
      }
    } else if (message.type === 'connection') {
      console.log(`   🔗 Conexão estabelecida: ${message.message}`);
    }
    
    console.log('');
    
    // Parar após 30 segundos
    if (messageCount >= 50) {
      console.log('⏰ Teste concluído após 50 mensagens');
      ws.close();
    }
    
  } catch (error) {
    console.log(`❌ Erro ao processar mensagem: ${error.message}`);
  }
});

ws.on('error', (error) => {
  console.log(`❌ Erro no WebSocket: ${error.message}`);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket fechado: ${code} - ${reason}`);
  console.log('\n📊 RESUMO DO TESTE:');
  console.log(`   Total de mensagens: ${messageCount}`);
  console.log(`   Oportunidades: ${opportunityCount}`);
  console.log(`   Price updates: ${priceUpdateCount}`);
  
  if (opportunityCount > 0) {
    console.log('\n🎉 SUCESSO! O WebSocket está funcionando e detectando oportunidades!');
  } else {
    console.log('\n⚠️  WebSocket conectado, mas nenhuma oportunidade detectada ainda.');
  }
});

// Timeout de 30 segundos
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('⏰ Timeout de 30 segundos atingido');
    ws.close();
  }
}, 30000); 