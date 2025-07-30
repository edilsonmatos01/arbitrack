const WebSocket = require('ws');

console.log('🧪 TESTE - FRONTEND CONECTANDO AO WEBSOCKET');
console.log('===========================================');

// Simular o que o frontend faria
const ws = new WebSocket('ws://localhost:10000');

let messagesReceived = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Frontend conectado ao WebSocket!');
  console.log('⏰ Aguardando oportunidades...');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    messagesReceived++;
    
    if (message.type === 'arbitrage') {
      console.log(`\n🎯 OPORTUNIDADE #${messagesReceived} RECEBIDA:`);
      console.log(`   Símbolo: ${message.baseSymbol}`);
      console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   Compra: ${message.buyAt.exchange} @ $${message.buyAt.price}`);
      console.log(`   Venda: ${message.sellAt.exchange} @ $${message.sellAt.price}`);
      console.log(`   Tipo: ${message.arbitrageType}`);
      console.log(`   Timestamp: ${new Date(message.timestamp).toLocaleString()}`);
      
      // Simular o que o frontend faria com a oportunidade
      console.log('📱 Frontend processaria esta oportunidade e atualizaria a tabela');
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
  console.log(`📊 Total de mensagens recebidas: ${messagesReceived}`);
  
  if (messagesReceived === 0) {
    console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
    console.log('   - Nenhuma mensagem foi recebida');
    console.log('   - O worker pode não estar enviando dados');
  } else {
    console.log('\n✅ SUCESSO:');
    console.log(`   - ${messagesReceived} mensagens recebidas`);
    console.log('   - WebSocket está funcionando corretamente');
    console.log('   - O frontend deveria estar exibindo as oportunidades');
  }
});

// Aguardar 30 segundos
setTimeout(() => {
  console.log('\n⏰ Tempo limite atingido (30s)');
  ws.close();
}, 30000); 