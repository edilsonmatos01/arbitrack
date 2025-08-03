const WebSocket = require('ws');

console.log('🔍 VERIFICANDO PROCESSAMENTO DO WORKER');
console.log('======================================');

// Conectar ao worker e monitorar por 60 segundos
const ws = new WebSocket('ws://localhost:10000');

let messageCount = 0;
let startTime = Date.now();
let lastMessageTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao worker!');
  console.log('⏰ Monitorando por 60 segundos...');
  console.log('📊 Aguardando dados das exchanges...');
});

ws.on('message', (data) => {
  messageCount++;
  lastMessageTime = Date.now();
  
  try {
    const message = JSON.parse(data);
    
    if (message.type === 'connection') {
      console.log(`📨 Mensagem #${messageCount}: Conexão estabelecida`);
    } else if (message.type === 'arbitrage' || message.type === 'opportunity') {
      console.log(`🎯 OPORTUNIDADE #${messageCount}:`, message);
      console.log(`   Spread: ${message.profitPercentage || message.spread}%`);
      console.log(`   Símbolo: ${message.baseSymbol || message.symbol}`);
    } else {
      console.log(`📨 Mensagem #${messageCount}:`, message);
    }
  } catch (error) {
    console.log(`📨 Dados #${messageCount} (não JSON):`, data.toString().substring(0, 100));
  }
});

ws.on('error', (error) => {
  console.log('❌ Erro na conexão:', error.message);
});

ws.on('close', (code, reason) => {
  const duration = (Date.now() - startTime) / 1000;
  const timeSinceLastMessage = (Date.now() - lastMessageTime) / 1000;
  
  console.log(`🔌 Conexão fechada após ${duration}s: ${code} - ${reason}`);
  console.log(`📊 Total de mensagens recebidas: ${messageCount}`);
  console.log(`⏰ Tempo desde última mensagem: ${timeSinceLastMessage}s`);
  
  if (messageCount <= 1) {
    console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
    console.log('   - Apenas mensagem de conexão recebida');
    console.log('   - O worker não está processando dados das exchanges');
    console.log('   - Verificar se as conexões das exchanges estão ativas');
    console.log('   - Verificar se há dados suficientes para arbitragem');
  } else {
    console.log('\n✅ Worker está funcionando!');
    console.log('   - Dados estão sendo processados');
    console.log('   - Conexões das exchanges estão ativas');
  }
});

// Verificar a cada 10 segundos se ainda está recebendo dados
const checkInterval = setInterval(() => {
  const timeSinceLastMessage = (Date.now() - lastMessageTime) / 1000;
  
  if (timeSinceLastMessage > 30) {
    console.log(`⚠️  Sem dados há ${timeSinceLastMessage.toFixed(1)}s`);
  }
}, 10000);

// Timeout para fechar
setTimeout(() => {
  clearInterval(checkInterval);
  if (ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
}, 60000); 