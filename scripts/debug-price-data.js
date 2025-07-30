const WebSocket = require('ws');

console.log('🔍 Debugando dados de preços do worker...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao worker!');
  console.log('📡 Monitorando dados de preços por 30 segundos...');
});

ws.on('message', (data) => {
  messageCount++;
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      console.log(`📨 Oportunidade #${messageCount}:`);
      console.log(`  - Símbolo: ${message.baseSymbol}`);
      console.log(`  - Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`  - Compra (Spot): ${message.buyAt.exchange} - ${message.buyAt.price}`);
      console.log(`  - Venda (Futures): ${message.sellAt.exchange} - ${message.sellAt.price}`);
      console.log(`  - Tipo: ${message.arbitrageType}`);
      console.log(`  - Timestamp: ${new Date(message.timestamp).toLocaleString()}`);
      
      // Verificar se os preços são válidos para salvar
      if (message.buyAt.price > 0 && message.sellAt.price > 0) {
        console.log(`  ✅ DADOS VÁLIDOS PARA SALVAR:`);
        console.log(`     - spotPrice: ${message.buyAt.price}`);
        console.log(`     - futuresPrice: ${message.sellAt.price}`);
        console.log(`     - spread: ${message.profitPercentage}`);
        console.log(`     - symbol: ${message.baseSymbol}`);
      } else {
        console.log(`  ❌ DADOS INVÁLIDOS:`);
        console.log(`     - spotPrice: ${message.buyAt.price} (${message.buyAt.price > 0 ? 'VÁLIDO' : 'INVÁLIDO'})`);
        console.log(`     - futuresPrice: ${message.sellAt.price} (${message.sellAt.price > 0 ? 'VÁLIDO' : 'INVÁLIDO'})`);
      }
      console.log('---');
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão WebSocket:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão WebSocket fechada');
});

// Timeout para parar o script
setTimeout(() => {
  console.log(`\n📊 RESUMO:`);
  console.log(`  - Total de mensagens recebidas: ${messageCount}`);
  console.log(`  - Tempo de execução: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log(`  - Taxa de mensagens: ${(messageCount / ((Date.now() - startTime) / 1000)).toFixed(1)} msg/s`);
  ws.close();
  process.exit(0);
}, 30000); 