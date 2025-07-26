const WebSocket = require('ws');

console.log('🔍 Testando conexão MEXC com método correto...');

const ws = new WebSocket('wss://wbs.mexc.com/ws');

ws.on('open', () => {
    console.log('✅ Conectado ao WebSocket da MEXC');
    
    // Usar o método correto
    const subscribeMsg = {
        "method": "sub.spot@ticker",
        "param": {
            "symbol": "btc_usdt"
        },
        "id": Date.now()
    };
    
    console.log('📤 Enviando subscrição:', JSON.stringify(subscribeMsg));
    ws.send(JSON.stringify(subscribeMsg));
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log('📨 Mensagem recebida:', JSON.stringify(message, null, 2));
        
        // Se for uma confirmação de subscrição
        if (message.id && message.result) {
            console.log('✅ Subscrição confirmada!');
        }
        
        // Se for dados de ticker
        if (message.c && message.c.includes('ticker')) {
            console.log('💰 Dados de preço recebidos:', {
                symbol: message.s,
                ask: message.a,
                bid: message.b
            });
        }
    } catch (error) {
        console.log('❌ Erro ao processar mensagem:', error.message);
        console.log('📄 Dados brutos:', data.toString());
    }
});

ws.on('error', (error) => {
    console.log('❌ Erro na conexão:', error.message);
});

ws.on('close', () => {
    console.log('🔌 Conexão fechada');
});

// Aguarda 30 segundos e depois fecha
setTimeout(() => {
    console.log('⏰ Teste concluído');
    ws.close();
    process.exit(0);
}, 30000); 