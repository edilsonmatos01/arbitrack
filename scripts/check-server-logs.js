const WebSocket = require('ws');

console.log('🔍 Verificando logs do servidor WebSocket...');

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
    console.log('✅ Conectado ao servidor WebSocket');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        
        if (message.type === 'arbitrage') {
            console.log('🎯 OPORTUNIDADE ENCONTRADA:', {
                symbol: message.baseSymbol,
                spread: message.profitPercentage.toFixed(4) + '%',
                direction: message.arbitrageType,
                buyAt: `${message.buyAt.exchange} @ ${message.buyAt.price}`,
                sellAt: `${message.sellAt.exchange} @ ${message.sellAt.price}`
            });
        } else if (message.type === 'price-update') {
            // Log apenas alguns preços para não poluir
            if (['BTC_USDT', 'ETH_USDT', 'SOL_USDT'].includes(message.symbol)) {
                console.log(`💰 ${message.symbol}: Ask=${message.bestAsk}, Bid=${message.bestBid}`);
            }
        }
    } catch (error) {
        console.log('❌ Erro ao processar mensagem:', error.message);
    }
});

ws.on('error', (error) => {
    console.log('❌ Erro na conexão WebSocket:', error.message);
});

ws.on('close', () => {
    console.log('🔌 Conexão WebSocket fechada');
});

// Aguarda 60 segundos e depois fecha
setTimeout(() => {
    console.log('⏰ Teste concluído');
    ws.close();
    process.exit(0);
}, 60000); 