const WebSocket = require('ws');
const fetch = require('node-fetch');

console.log('🧪 TESTE INDIVIDUAL - MEXC FUTURES');
console.log('===================================');

// Teste da API REST
async function testMexcAPI() {
    console.log('\n📡 Testando API REST MEXC Futures...');
    
    try {
        const response = await fetch('https://contract.mexc.com/api/v1/contract/detail', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ API REST funcionando: ${data.data ? data.data.length : 0} contratos encontrados`);
        
        if (data && data.data && Array.isArray(data.data)) {
            const usdtContracts = data.data
                .filter(contract => 
                    contract.quoteCoin === 'USDT' && 
                    contract.futureType === 1 && 
                    !contract.symbol.includes('_INDEX_')
                )
                .map(contract => contract.symbol);
            
            console.log(`✅ Contratos USDT Perpétuos: ${usdtContracts.length}`);
            console.log(`📋 Primeiros 5: ${usdtContracts.slice(0, 5).join(', ')}`);
            
            return usdtContracts;
        } else {
            console.log('⚠️ Formato de resposta inesperado');
            return ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'XRP_USDT', 'BNB_USDT'];
        }
    } catch (error) {
        console.error('❌ Erro na API REST:', error.message);
        return ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'XRP_USDT', 'BNB_USDT'];
    }
}

// Teste do WebSocket
function testMexcWebSocket(symbols) {
    console.log('\n🔌 Testando WebSocket MEXC Futures...');
    
    return new Promise((resolve) => {
        const ws = new WebSocket('wss://contract.mexc.com/edge', {
            perMessageDeflate: false,
            handshakeTimeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Origin': 'https://contract.mexc.com'
            }
        });

        let connectionEstablished = false;
        let subscriptionsSent = 0;
        let priceUpdates = 0;
        let pingResponses = 0;
        const testSymbols = symbols.slice(0, 5); // Testar apenas 5 símbolos

        ws.on('open', () => {
            console.log('✅ Conexão WebSocket estabelecida!');
            connectionEstablished = true;
            
            // Enviar subscrições
            testSymbols.forEach((symbol, index) => {
                const msg = {
                    "method": "sub.ticker",
                    "param": {
                        "symbol": symbol
                    }
                };
                
                ws.send(JSON.stringify(msg));
                subscriptionsSent++;
                console.log(`📤 Subscrição ${index + 1}: ${symbol}`);
            });

            // Enviar ping após 5 segundos
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    const pingMsg = { "method": "ping" };
                    ws.send(JSON.stringify(pingMsg));
                    console.log('📤 Ping enviado');
                }
            }, 5000);
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                // Responde ao ping do servidor
                if (message.method === "ping") {
                    const pongMsg = { "method": "pong" };
                    ws.send(JSON.stringify(pongMsg));
                    console.log('📤 Pong enviado');
                    return;
                }

                // Log de confirmação de subscrições
                if (message.id && message.result) {
                    console.log(`✅ Subscrição confirmada - ID: ${message.id}`);
                    return;
                }

                // Processa mensagens de ticker
                if (message.channel === "push.ticker" && message.data) {
                    const ticker = message.data;
                    const bestAsk = parseFloat(ticker.ask1);
                    const bestBid = parseFloat(ticker.bid1);

                    if (bestAsk && bestBid && bestAsk > 0 && bestBid > 0) {
                        priceUpdates++;
                        console.log(`💰 ${ticker.symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
                        
                        if (priceUpdates >= 10) {
                            console.log('✅ Teste WebSocket concluído com sucesso!');
                            ws.close();
                            resolve(true);
                        }
                    }
                } else if (message.error) {
                    console.log(`⚠️ Erro recebido: ${JSON.stringify(message.error)}`);
                }
            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error.message);
            }
        });

        ws.on('error', (error) => {
            console.error('❌ Erro no WebSocket:', error.message);
            resolve(false);
        });

        ws.on('close', (code, reason) => {
            console.log(`🔌 Conexão WebSocket fechada: ${code} ${reason?.toString()}`);
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
    console.log('🚀 Iniciando teste individual MEXC Futures...\n');
    
    // Teste da API REST
    const symbols = await testMexcAPI();
    
    if (symbols.length === 0) {
        console.log('\n❌ Teste falhou: Não foi possível obter símbolos da API');
        process.exit(1);
    }
    
    // Teste do WebSocket
    const wsSuccess = await testMexcWebSocket(symbols);
    
    console.log('\n📊 RESULTADO DO TESTE:');
    console.log('======================');
    console.log(`API REST: ${symbols.length > 0 ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    console.log(`WebSocket: ${wsSuccess ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    
    if (symbols.length > 0 && wsSuccess) {
        console.log('\n🎉 MEXC FUTURES: TESTE APROVADO!');
        console.log('✅ Conector pronto para uso');
    } else {
        console.log('\n⚠️ MEXC FUTURES: TESTE COM PROBLEMAS');
        console.log('❌ Verificar conectividade ou configurações');
    }
}

runTest().catch(console.error); 