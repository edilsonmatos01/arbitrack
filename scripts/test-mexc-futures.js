const WebSocket = require('ws');

console.log('🔍 Testando diferentes URLs da MEXC Futures...');

// Lista de URLs para testar
const urls = [
    'wss://contract.mexc.com/ws',
    'wss://contract.mexc.com/ws/',
    'wss://futures.mexc.com/ws',
    'wss://futures.mexc.com/ws/',
    'wss://api.mexc.com/ws',
    'wss://api.mexc.com/ws/',
    'wss://contract.mexc.com/raw/ws',
    'wss://futures.mexc.com/raw/ws'
];

let currentUrlIndex = 0;

function testNextUrl() {
    if (currentUrlIndex >= urls.length) {
        console.log('❌ Todas as URLs falharam');
        process.exit(1);
    }

    const url = urls[currentUrlIndex];
    console.log(`\n🔗 Testando URL: ${url}`);
    
    const ws = new WebSocket(url);

    ws.on('open', () => {
        console.log(`✅ Conectado com sucesso a: ${url}`);
        
        // Enviar subscrição para WHITE_USDT
        const subscribeMsg = {
            "op": "sub",
            "symbol": "WHITE_USDT",
            "channel": "contract.ticker"
        };
        
        console.log('📤 Enviando subscrição:', JSON.stringify(subscribeMsg));
        ws.send(JSON.stringify(subscribeMsg));
        
        // Enviar ping após 5 segundos
        setTimeout(() => {
            const pingMsg = { "op": "ping" };
            console.log('📤 Enviando ping:', JSON.stringify(pingMsg));
            ws.send(JSON.stringify(pingMsg));
        }, 5000);
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📨 Mensagem recebida:', JSON.stringify(message, null, 2));
            
            // Se for dados de ticker
            if (message.c && message.c.includes('contract.ticker')) {
                console.log('💰 Dados de preço recebidos:', {
                    symbol: message.s,
                    ask: message.a,
                    bid: message.b
                });
            }
            
            // Se for resposta de ping
            if (message.op === 'pong') {
                console.log('🏓 Pong recebido!');
            }
        } catch (error) {
            console.log('❌ Erro ao processar mensagem:', error.message);
            console.log('📄 Dados brutos:', data.toString());
        }
    });

    ws.on('error', (error) => {
        console.log(`❌ Erro na conexão com ${url}:`, error.message);
        ws.close();
    });

    ws.on('close', () => {
        console.log(`🔌 Conexão fechada com ${url}`);
        currentUrlIndex++;
        
        // Aguarda 2 segundos antes de testar a próxima URL
        setTimeout(() => {
            testNextUrl();
        }, 2000);
    });

    // Timeout para esta URL
    setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
            console.log(`⏰ Timeout para ${url}`);
            ws.close();
        }
    }, 10000);
}

// Inicia o teste
testNextUrl(); 