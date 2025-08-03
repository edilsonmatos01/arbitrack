const WebSocket = require('ws');

console.log('🔍 Monitorando worker em tempo real...');
console.log('⏰ Aguardando dados por 120 segundos...\n');

const ws = new WebSocket('ws://localhost:10000');

let opportunityCount = 0;
let heartbeatCount = 0;
let lastOpportunityTime = null;

ws.on('open', () => {
  console.log('✅ Conectado ao worker!');
  console.log('📊 Monitorando oportunidades de arbitragem...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      opportunityCount++;
      lastOpportunityTime = new Date();
      
      console.log(`🎯 OPORTUNIDADE #${opportunityCount}:`);
      console.log(`   Símbolo: ${message.baseSymbol}`);
      console.log(`   Spread: ${message.profitPercentage.toFixed(4)}%`);
      console.log(`   Compra: ${message.buyAt.exchange} ${message.buyAt.marketType} - $${message.buyAt.price}`);
      console.log(`   Venda: ${message.sellAt.exchange} ${message.sellAt.marketType} - $${message.sellAt.price}`);
      console.log(`   Timestamp: ${new Date(message.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log('');
      
      // Verificar se os preços são válidos
      if (message.buyAt.price > 0 && message.sellAt.price > 0) {
        console.log('✅ Preços válidos detectados!');
      } else {
        console.log('❌ Preços inválidos detectados!');
      }
    } else if (message.type === 'heartbeat') {
      heartbeatCount++;
      console.log(`💓 Heartbeat #${heartbeatCount}: ${message.message}`);
    } else {
      console.log('📨 Mensagem recebida:', message);
    }
  } catch (error) {
    console.log('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
});

// Encerrar após 120 segundos
setTimeout(() => {
  console.log('\n📊 RESUMO DO MONITORAMENTO:');
  console.log(`   Total de oportunidades: ${opportunityCount}`);
  console.log(`   Total de heartbeats: ${heartbeatCount}`);
  if (lastOpportunityTime) {
    console.log(`   Última oportunidade: ${lastOpportunityTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  }
  
  if (opportunityCount > 0) {
    console.log('\n✅ O worker está funcionando e enviando oportunidades!');
    console.log('🔍 Agora vamos verificar se estão sendo salvas no banco...');
  } else if (heartbeatCount > 0) {
    console.log('\n⚠️  O worker está funcionando mas não encontrou oportunidades ainda.');
    console.log('🔍 Pode estar processando a lista grande de símbolos...');
  } else {
    console.log('\n❌ Nenhuma atividade detectada!');
    console.log('🔍 Verificar se o worker está realmente processando dados...');
  }
  
  ws.close();
  process.exit(0);
}, 120000); 