const WebSocket = require('ws');

// Configurações
const WS_URL = 'ws://localhost:10000';
const TEST_DURATION = 10000; // 10 segundos

console.log('🧪 Teste de Exibição de Oportunidades');
console.log('');

// Estatísticas
const stats = {
  opportunities: 0,
  priceUpdates: 0,
  heartbeats: 0,
  errors: 0,
  startTime: Date.now()
};

// Conectar ao WebSocket
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Conectado ao servidor WebSocket');
  console.log('⏱️  Aguardando oportunidades...');
  console.log('');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    switch (message.type) {
      case 'opportunity':
        stats.opportunities++;
        console.log(`🎯 OPORTUNIDADE #${stats.opportunities}:`);
        console.log(`   Símbolo: ${message.symbol}`);
        console.log(`   Spread: ${message.spread.toFixed(3)}%`);
        console.log(`   Compra: ${message.exchangeBuy} @ ${message.spotPrice}`);
        console.log(`   Venda: ${message.exchangeSell} @ ${message.futuresPrice}`);
        console.log(`   Direção: ${message.direction}`);
        console.log('');
        break;
        
      case 'price-update':
        stats.priceUpdates++;
        if (stats.priceUpdates % 50 === 0) { // Log a cada 50 atualizações
          console.log(`📊 ${stats.priceUpdates} atualizações de preço recebidas`);
        }
        break;
        
      case 'heartbeat':
        stats.heartbeats++;
        console.log(`💓 Heartbeat #${stats.heartbeats}: ${message.message}`);
        break;
        
      case 'connection':
        console.log(`🔗 ${message.message}`);
        console.log(`📊 Pares monitorados: ${message.monitoredPairs}`);
        console.log('');
        break;
        
      default:
        console.log(`📨 Mensagem desconhecida: ${message.type}`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    stats.errors++;
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro de WebSocket:', error);
  stats.errors++;
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
});

// Timer para encerrar o teste
setTimeout(() => {
  console.log('');
  console.log('📊 RESULTADOS DO TESTE:');
  console.log(`⏱️  Duração: ${(Date.now() - stats.startTime) / 1000}s`);
  console.log(`🎯 Oportunidades encontradas: ${stats.opportunities}`);
  console.log(`📊 Atualizações de preço: ${stats.priceUpdates}`);
  console.log(`💓 Heartbeats: ${stats.heartbeats}`);
  console.log(`❌ Erros: ${stats.errors}`);
  
  if (stats.opportunities > 0) {
    console.log('');
    console.log('✅ SUCESSO: Oportunidades estão sendo geradas!');
    console.log('💡 Verifique se elas aparecem na tabela da interface.');
  } else {
    console.log('');
    console.log('⚠️  ATENÇÃO: Nenhuma oportunidade foi encontrada.');
    console.log('💡 Verifique:');
    console.log('   1. Se o worker está rodando');
    console.log('   2. Se os conectores estão funcionando');
    console.log('   3. Se há spreads significativos nos pares monitorados');
  }
  
  ws.close();
  process.exit(0);
}, TEST_DURATION); 