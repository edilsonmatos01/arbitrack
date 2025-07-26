const WebSocket = require('ws');

// URL do worker na Render
const WS_URL = 'wss://robo-de-arbitragem-tracker.onrender.com';

console.log(`🔍 Testando conexão com o worker na Render: ${WS_URL}`);

try {
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    console.log('✅ Conexão WebSocket estabelecida com sucesso!');
    
    // Enviar mensagem de teste
    ws.send(JSON.stringify({
      type: 'client-connect',
      client: 'test-script',
      timestamp: Date.now()
    }));
    
    console.log('📤 Mensagem de teste enviada');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Mensagem recebida:', message);
      
      if (message.type === 'connection') {
        console.log('✅ Worker respondeu com mensagem de conexão');
      }
    } catch (error) {
      console.log('📨 Dados recebidos (não JSON):', data.toString());
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Conexão fechada. Código: ${code}, Razão: ${reason}`);
  });
  
  ws.on('error', (error) => {
    console.error('❌ Erro na conexão WebSocket:', error.message);
  });
  
  // Timeout para fechar a conexão após 10 segundos
  setTimeout(() => {
    console.log('⏰ Fechando conexão após timeout...');
    ws.close();
    process.exit(0);
  }, 10000);
  
} catch (error) {
  console.error('❌ Erro ao criar conexão WebSocket:', error.message);
} 