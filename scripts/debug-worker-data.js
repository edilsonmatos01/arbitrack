const WebSocket = require('ws');

console.log('🔍 Debugando dados do worker em tempo real...');

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao worker!');
  console.log('📡 Monitorando dados por 30 segundos...');
});

ws.on('message', (data) => {
  messageCount++;
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      const spotPrice = message.buyAt.price;
      const futuresPrice = message.sellAt.price;
      
      console.log(`📨 Oportunidade #${messageCount}: ${message.baseSymbol}`);
      console.log(`   - Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   - Spot Price: ${spotPrice} (${typeof spotPrice})`);
      console.log(`   - Futures Price: ${futuresPrice} (${typeof futuresPrice})`);
      console.log(`   - Timestamp: ${new Date(message.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      
      if (spotPrice > 0 && futuresPrice > 0) {
        console.log(`   ✅ DADOS VÁLIDOS PARA SALVAR`);
      } else {
        console.log(`   ❌ DADOS INVÁLIDOS - PREÇOS ZERO`);
        console.log(`   - buyAt:`, message.buyAt);
        console.log(`   - sellAt:`, message.sellAt);
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
  ws.close();
  process.exit(0);
}, 30000); 