const WebSocket = require('ws');

console.log('🔍 Testando símbolos das posições abertas...');

// Símbolos das posições abertas (baseado na imagem)
const positionSymbols = ['CBK', 'FARM'];

// Mapear para diferentes formatos possíveis
const testSymbols = [];
positionSymbols.forEach(symbol => {
  testSymbols.push(
    symbol,                    // CBK, FARM
    `${symbol}_USDT`,          // CBK_USDT, FARM_USDT
    `${symbol}/USDT`,          // CBK/USDT, FARM/USDT
    symbol.toUpperCase(),      // CBK, FARM
    `${symbol.toUpperCase()}_USDT`, // CBK_USDT, FARM_USDT
    `${symbol.toUpperCase()}/USDT`  // CBK/USDT, FARM/USDT
  );
});

console.log('📋 Símbolos a testar:', testSymbols);

const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let priceUpdateCount = 0;
let relevantUpdates = {};

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket!');
  
  // Enviar mensagem de identificação
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'position-test',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    messageCount++;
    
    if (message.type === 'price-update') {
      priceUpdateCount++;
      
      // Verificar se é um símbolo relevante
      const symbol = message.symbol;
      if (testSymbols.includes(symbol)) {
        if (!relevantUpdates[symbol]) {
          relevantUpdates[symbol] = [];
        }
        
        relevantUpdates[symbol].push({
          marketType: message.marketType,
          bestAsk: message.bestAsk,
          bestBid: message.bestBid,
          timestamp: new Date(message.timestamp).toLocaleTimeString()
        });
        
        console.log(`💰 [RELEVANTE] ${symbol} ${message.marketType}: Ask=${message.bestAsk}, Bid=${message.bestBid}`);
      }
    }
    
    // Mostrar estatísticas a cada 50 mensagens
    if (messageCount % 50 === 0) {
      console.log(`\n📊 Estatísticas: ${messageCount} mensagens, ${priceUpdateCount} price-updates`);
      console.log('📋 Atualizações relevantes encontradas:');
      Object.keys(relevantUpdates).forEach(symbol => {
        console.log(`  ${symbol}: ${relevantUpdates[symbol].length} atualizações`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro WebSocket:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Conexão fechada: ${code} - ${reason}`);
  console.log(`📊 Total: ${messageCount} mensagens, ${priceUpdateCount} price-updates`);
  
  console.log('\n📋 RESUMO FINAL - Atualizações relevantes:');
  Object.keys(relevantUpdates).forEach(symbol => {
    const updates = relevantUpdates[symbol];
    console.log(`\n${symbol}:`);
    updates.forEach(update => {
      console.log(`  ${update.timestamp} - ${update.marketType}: Ask=${update.bestAsk}, Bid=${update.bestBid}`);
    });
  });
  
  if (Object.keys(relevantUpdates).length === 0) {
    console.log('❌ NENHUMA atualização relevante encontrada!');
    console.log('🔍 Verificando se os símbolos estão sendo enviados pelo worker...');
  }
});

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
  process.exit(0);
}, 30000); 