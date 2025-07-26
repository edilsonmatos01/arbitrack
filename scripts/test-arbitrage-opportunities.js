const WebSocket = require('ws');

console.log('🔍 Testando oportunidades de arbitragem...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
    console.log('✅ Conectado ao servidor WebSocket');
    
    // Aguarda um pouco para receber dados
    setTimeout(() => {
        console.log('📊 Verificando oportunidades...');
    }, 2000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'arbitrage') {
            console.log('\n💰 OPORTUNIDADE ENCONTRADA!');
            console.log(`📈 Símbolo: ${message.symbol}`);
            console.log(`🏪 Gate.io: Ask=${message.gateio.ask}, Bid=${message.gateio.bid}`);
            console.log(`🏪 MEXC: Ask=${message.mexc.ask}, Bid=${message.mexc.bid}`);
            console.log(`📊 Spread: ${message.spread.toFixed(4)}%`);
            console.log(`⏰ Timestamp: ${new Date().toLocaleTimeString()}`);
            console.log('─'.repeat(50));
        } else if (message.type === 'price-update') {
            // Log apenas para pares prioritários
            const priorityPairs = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'WHITE_USDT'];
            if (priorityPairs.includes(message.symbol)) {
                console.log(`📊 ${message.identifier} ${message.symbol}: Ask=${message.bestAsk}, Bid=${message.bestBid}`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
    }
});

ws.on('error', (error) => {
    console.error('❌ Erro na conexão WebSocket:', error);
});

ws.on('close', () => {
    console.log('🔌 Conexão fechada');
});

// Aguarda 30 segundos e fecha
setTimeout(() => {
    console.log('⏰ Teste concluído');
    ws.close();
    process.exit(0);
}, 30000); 