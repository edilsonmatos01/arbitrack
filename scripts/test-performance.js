const WebSocket = require('ws');

// Configurações
const WS_URL = 'ws://localhost:10000';
const TEST_DURATION = 30000; // 30 segundos
const PRIORITY_PAIRS = ['MGO_USDT', 'GNC_USDT', 'BTC_USDT', 'ETH_USDT', 'SOL_USDT'];

// Estatísticas
const stats = {
  startTime: Date.now(),
  totalMessages: 0,
  priceUpdates: 0,
  opportunities: 0,
  priorityPriceUpdates: 0,
  latency: {
    min: Infinity,
    max: 0,
    avg: 0,
    samples: []
  },
  errors: 0
};

console.log('🚀 Teste de Performance - Sistema de Arbitragem em Tempo Real');
console.log(`⏱️  Duração do teste: ${TEST_DURATION / 1000} segundos`);
console.log(`🎯 Pares prioritários: ${PRIORITY_PAIRS.join(', ')}`);
console.log('');

// Conectar ao WebSocket
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Conectado ao servidor WebSocket');
  console.log('📊 Iniciando coleta de dados...');
  console.log('');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    const receiveTime = Date.now();
    
    stats.totalMessages++;
    
    if (message.type === 'price-update') {
      stats.priceUpdates++;
      
      // Calcular latência se houver timestamp
      if (message.timestamp) {
        const latency = receiveTime - message.timestamp;
        stats.latency.samples.push(latency);
        stats.latency.min = Math.min(stats.latency.min, latency);
        stats.latency.max = Math.max(stats.latency.max, latency);
        
        // Verificar se é um par prioritário
        if (PRIORITY_PAIRS.includes(message.symbol)) {
          stats.priorityPriceUpdates++;
          console.log(`⚡ PRIORITY: ${message.symbol} - Ask: ${message.bestAsk} | Bid: ${message.bestBid} | Latency: ${latency}ms`);
        }
      }
    } else if (message.type === 'opportunity') {
      stats.opportunities++;
      console.log(`📊 OPPORTUNITY: ${message.symbol} - ${message.spread.toFixed(4)}% | Spot: ${message.spotPrice} | Futures: ${message.futuresPrice}`);
    } else if (message.type === 'heartbeat') {
      console.log(`💓 HEARTBEAT: ${message.message}`);
    }
    
    // Mostrar estatísticas a cada 100 mensagens
    if (stats.totalMessages % 100 === 0) {
      showStats();
    }
    
  } catch (error) {
    stats.errors++;
    console.error('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão WebSocket:', error.message);
});

ws.on('close', () => {
  console.log('❌ Conexão WebSocket fechada');
  showFinalStats();
});

function showStats() {
  const elapsed = Date.now() - stats.startTime;
  const messagesPerSecond = (stats.totalMessages / elapsed) * 1000;
  const priceUpdatesPerSecond = (stats.priceUpdates / elapsed) * 1000;
  
  console.log(`📈 ESTATÍSTICAS (${elapsed / 1000}s):`);
  console.log(`   Mensagens/s: ${messagesPerSecond.toFixed(1)}`);
  console.log(`   Atualizações de preço/s: ${priceUpdatesPerSecond.toFixed(1)}`);
  console.log(`   Oportunidades: ${stats.opportunities}`);
  console.log(`   Atualizações prioritárias: ${stats.priorityPriceUpdates}`);
  console.log(`   Erros: ${stats.errors}`);
  console.log('');
}

function showFinalStats() {
  const elapsed = Date.now() - stats.startTime;
  const messagesPerSecond = (stats.totalMessages / elapsed) * 1000;
  const priceUpdatesPerSecond = (stats.priceUpdates / elapsed) * 1000;
  
  // Calcular latência média
  if (stats.latency.samples.length > 0) {
    stats.latency.avg = stats.latency.samples.reduce((a, b) => a + b, 0) / stats.latency.samples.length;
  }
  
  console.log('');
  console.log('🎯 RESULTADOS FINAIS:');
  console.log('='.repeat(50));
  console.log(`⏱️  Tempo total: ${(elapsed / 1000).toFixed(1)}s`);
  console.log(`📨 Total de mensagens: ${stats.totalMessages}`);
  console.log(`💰 Atualizações de preço: ${stats.priceUpdates}`);
  console.log(`📊 Oportunidades: ${stats.opportunities}`);
  console.log(`⚡ Atualizações prioritárias: ${stats.priorityPriceUpdates}`);
  console.log(`❌ Erros: ${stats.errors}`);
  console.log('');
  console.log('🚀 PERFORMANCE:');
  console.log(`   Mensagens/s: ${messagesPerSecond.toFixed(1)}`);
  console.log(`   Atualizações de preço/s: ${priceUpdatesPerSecond.toFixed(1)}`);
  console.log('');
  console.log('⚡ LATÊNCIA:');
  console.log(`   Mínima: ${stats.latency.min}ms`);
  console.log(`   Máxima: ${stats.latency.max}ms`);
  console.log(`   Média: ${stats.latency.avg.toFixed(1)}ms`);
  console.log(`   Amostras: ${stats.latency.samples.length}`);
  console.log('');
  
  // Avaliação de performance
  if (messagesPerSecond >= 10 && stats.latency.avg <= 100) {
    console.log('✅ PERFORMANCE EXCELENTE - Sistema otimizado!');
  } else if (messagesPerSecond >= 5 && stats.latency.avg <= 200) {
    console.log('🟡 PERFORMANCE BOA - Sistema funcionando bem');
  } else {
    console.log('🔴 PERFORMANCE BAIXA - Necessita otimização');
  }
  
  process.exit(0);
}

// Timer para encerrar o teste
setTimeout(() => {
  console.log('\n⏰ Tempo de teste concluído');
  ws.close();
}, TEST_DURATION);

// Tratamento de sinais para encerramento limpo
process.on('SIGINT', () => {
  console.log('\n🛑 Teste interrompido pelo usuário');
  ws.close();
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Teste encerrado');
  ws.close();
}); 