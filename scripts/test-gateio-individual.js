const WebSocket = require('ws');
const fetch = require('node-fetch');

console.log('🧪 TESTE INDIVIDUAL - GATE.IO SPOT');
console.log('====================================');

// Teste da API REST
async function testGateioAPI() {
    console.log('\n📡 Testando API REST Gate.io...');
    
    try {
        const response = await fetch('https://api.gateio.ws/api/v4/spot/currency_pairs', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ API REST funcionando: ${data.length} pares encontrados`);
        
        const usdtPairs = data
            .filter(pair => pair.quote === 'USDT' && pair.trade_status === 'tradable')
            .map(pair => `${pair.base}_${pair.quote}`);
        
        console.log(`✅ Pares USDT: ${usdtPairs.length}`);
        console.log(`📋 Primeiros 5: ${usdtPairs.slice(0, 5).join(', ')}`);
        
        return usdtPairs;
    } catch (error) {
        console.error('❌ Erro na API REST:', error.message);
        return [];
    }
}

// Teste do WebSocket
function testGateioWebSocket(symbols) {
    console.log('\n🔌 Testando WebSocket Gate.io...');
    
    return new Promise((resolve) => {
        const ws = new WebSocket('wss://api.gateio.ws/ws/v4/', {
            handshakeTimeout: 30000,
            perMessageDeflate: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        let connectionEstablished = false;
        let subscriptionsSent = 0;
        let priceUpdates = 0;
        const testSymbols = symbols.slice(0, 5); // Testar apenas 5 símbolos

        ws.on('open', () => {
            console.log('✅ Conexão WebSocket estabelecida!');
            connectionEstablished = true;
            
            // Enviar subscrições
            testSymbols.forEach((symbol, index) => {
                const msg = {
                    time: Math.floor(Date.now() / 1000),
                    channel: "spot.tickers",
                    event: "subscribe",
                    payload: [symbol]
                };
                
                ws.send(JSON.stringify(msg));
                subscriptionsSent++;
                console.log(`📤 Subscrição ${index + 1}: ${symbol}`);
            });
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (message.event === 'subscribe') {
                    console.log(`✅ Subscrição confirmada: ${message.channel}`);
                } else if (message.event === 'update' && message.result) {
                    const ticker = message.result;
                    const symbol = ticker.currency_pair;
                    const bestAsk = parseFloat(ticker.lowest_ask);
                    const bestBid = parseFloat(ticker.highest_bid);
                    
                    if (bestAsk && bestBid && bestAsk > 0 && bestBid > 0) {
                        priceUpdates++;
                        console.log(`💰 ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
                        
                        if (priceUpdates >= 10) {
                            console.log('✅ Teste WebSocket concluído com sucesso!');
                            ws.close();
                            resolve(true);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error.message);
            }
        });

        ws.on('error', (error) => {
            console.error('❌ Erro no WebSocket:', error.message);
            resolve(false);
        });

        ws.on('close', () => {
            console.log('🔌 Conexão WebSocket fechada');
            resolve(connectionEstablished);
        });

        // Timeout de 30 segundos
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            resolve(connectionEstablished);
        }, 30000);
    });
}

// Teste principal
async function runTest() {
    console.log('🚀 Iniciando teste individual Gate.io...\n');
    
    // Teste da API REST
    const symbols = await testGateioAPI();
    
    if (symbols.length === 0) {
        console.log('\n❌ Teste falhou: Não foi possível obter símbolos da API');
        process.exit(1);
    }
    
    // Teste do WebSocket
    const wsSuccess = await testGateioWebSocket(symbols);
    
    console.log('\n📊 RESULTADO DO TESTE:');
    console.log('======================');
    console.log(`API REST: ${symbols.length > 0 ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    console.log(`WebSocket: ${wsSuccess ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    
    if (symbols.length > 0 && wsSuccess) {
        console.log('\n🎉 GATE.IO SPOT: TESTE APROVADO!');
        console.log('✅ Conector pronto para uso');
    } else {
        console.log('\n⚠️ GATE.IO SPOT: TESTE COM PROBLEMAS');
        console.log('❌ Verificar conectividade ou configurações');
    }
}

runTest().catch(console.error); 