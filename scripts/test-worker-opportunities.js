const WebSocket = require('ws');

console.log('🧪 TESTE - WORKER ENVIANDO OPORTUNIDADES');
console.log('========================================');

// Conectar ao WebSocket do worker na porta 10000
const ws = new WebSocket('ws://localhost:10000');

let opportunitiesReceived = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket do worker!');
  console.log('⏰ Aguardando oportunidades...');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      opportunitiesReceived++;
      console.log(`\n🎯 OPORTUNIDADE #${opportunitiesReceived}:`);
      console.log(`   Símbolo: ${message.baseSymbol}`);
      console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   Compra: ${message.buyAt.exchange} @ $${message.buyAt.price}`);
      console.log(`   Venda: ${message.sellAt.exchange} @ $${message.sellAt.price}`);
      console.log(`   Tipo: ${message.arbitrageType}`);
      console.log(`   Timestamp: ${new Date(message.timestamp).toLocaleString()}`);
    } else if (message.type === 'heartbeat') {
      console.log(`💓 Heartbeat: ${message.message}`);
    } else if (message.type === 'connection') {
      console.log(`🔗 ${message.message}`);
    } else {
      console.log(`📨 Outra mensagem: ${message.type}`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro no WebSocket:', error.message);
});

ws.on('close', () => {
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n🔌 WebSocket fechado após ${duration.toFixed(1)}s`);
  console.log(`📊 Total de oportunidades recebidas: ${opportunitiesReceived}`);
  
  if (opportunitiesReceived === 0) {
    console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
    console.log('   - Nenhuma oportunidade foi recebida');
    console.log('   - O worker pode não estar processando dados');
    console.log('   - Verificar se as WebSockets das exchanges estão conectadas');
  } else {
    console.log('\n✅ SUCESSO:');
    console.log(`   - ${opportunitiesReceived} oportunidades recebidas`);
    console.log('   - Worker está funcionando corretamente');
  }
});

// Aguardar 30 segundos para receber oportunidades
setTimeout(() => {
  console.log('\n⏰ Tempo limite atingido (30s)');
  ws.close();
}, 30000); 