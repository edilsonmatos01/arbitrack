// TESTE DE CONEXÕES WEBSOCKET - GATE.IO SPOT + MEXC FUTURES
// Este arquivo testa as conexões WebSocket para verificar se estão funcionando

const WebSocket = require('ws');
const fetch = require('node-fetch');

// Configurações
const GATEIO_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';

// Teste Gate.io Spot
async function testGateioSpot() {
    console.log('\n🔍 TESTANDO GATE.IO SPOT...');
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(GATEIO_WS_URL);
        let connected = false;
        let receivedData = false;
        
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('❌ Gate.io Spot: Timeout na conexão');
                ws.close();
                resolve(false);
            } else if (!receivedData) {
                console.log('❌ Gate.io Spot: Conexão estabelecida mas sem dados');
                ws.close();
                resolve(false);
            }
        }, 10000);
        
        ws.on('open', () => {
            console.log('✅ Gate.io Spot: Conexão estabelecida');
            connected = true;
            
            // Enviar subscrição para BTC_USDT
            const subscribeMsg = {
                time: Math.floor(Date.now() / 1000),
                channel: "spot.tickers",
                event: "subscribe",
                payload: ["BTC_USDT"]
            };
            
            ws.send(JSON.stringify(subscribeMsg));
            console.log('📤 Gate.io Spot: Subscrição enviada para BTC_USDT');
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (message.event === 'subscribe') {
                    console.log('✅ Gate.io Spot: Subscrição confirmada');
                } else if (message.event === 'update' && message.result) {
                    const ticker = message.result;
                    if (ticker.currency_pair === 'BTC_USDT') {
                        console.log(`✅ Gate.io Spot: Dados recebidos - Ask: ${ticker.lowest_ask}, Bid: ${ticker.highest_bid}`);
                        receivedData = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve(true);
                    }
                }
            } catch (error) {
                console.error('❌ Gate.io Spot: Erro ao processar mensagem:', error);
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ Gate.io Spot: Erro na conexão:', error.message);
            clearTimeout(timeout);
            resolve(false);
        });
        
        ws.on('close', () => {
            console.log('🔌 Gate.io Spot: Conexão fechada');
        });
    });
}

// Teste MEXC Futures
async function testMexcFutures() {
    console.log('\n🔍 TESTANDO MEXC FUTURES...');
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(MEXC_FUTURES_WS_URL);
        let connected = false;
        let receivedData = false;
        
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('❌ MEXC Futures: Timeout na conexão');
                ws.close();
                resolve(false);
            } else if (!receivedData) {
                console.log('❌ MEXC Futures: Conexão estabelecida mas sem dados');
                ws.close();
                resolve(false);
            }
        }, 10000);
        
        ws.on('open', () => {
            console.log('✅ MEXC Futures: Conexão estabelecida');
            connected = true;
            
            // Enviar subscrição para BTC_USDT
            const subscribeMsg = {
                method: "sub.ticker",
                param: { symbol: "BTC_USDT" }
            };
            
            ws.send(JSON.stringify(subscribeMsg));
            console.log('📤 MEXC Futures: Subscrição enviada para BTC_USDT');
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (message.channel === 'push.ticker' && message.data) {
                    const symbol = message.data.symbol;
                    if (symbol === 'BTC_USDT') {
                        console.log(`✅ MEXC Futures: Dados recebidos - Ask: ${message.data.ask1}, Bid: ${message.data.bid1}`);
                        receivedData = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve(true);
                    }
                }
            } catch (error) {
                console.error('❌ MEXC Futures: Erro ao processar mensagem:', error);
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ MEXC Futures: Erro na conexão:', error.message);
            clearTimeout(timeout);
            resolve(false);
        });
        
        ws.on('close', () => {
            console.log('🔌 MEXC Futures: Conexão fechada');
        });
    });
}

// Teste de API REST
async function testRestApis() {
    console.log('\n🔍 TESTANDO APIs REST...');
    
    try {
        // Teste Gate.io API
        console.log('📡 Testando Gate.io API...');
        const gateioResponse = await fetch('https://api.gateio.ws/api/v4/spot/currency_pairs');
        const gateioData = await gateioResponse.json();
        console.log(`✅ Gate.io API: ${gateioData.length} pares encontrados`);
        
        // Teste MEXC API
        console.log('📡 Testando MEXC API...');
        const mexcResponse = await fetch('https://contract.mexc.com/api/v1/contract/detail');
        const mexcData = await mexcResponse.json();
        console.log(`✅ MEXC API: ${Array.isArray(mexcData) ? mexcData.length : 'Resposta inválida'} contratos encontrados`);
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao testar APIs REST:', error.message);
        return false;
    }
}

// Função principal de teste
async function runTests() {
    console.log('🚀 INICIANDO TESTES DE CONECTIVIDADE...');
    console.log('=' * 50);
    
    const results = {
        gateioSpot: false,
        mexcFutures: false,
        restApis: false
    };
    
    // Teste APIs REST
    results.restApis = await testRestApis();
    
    // Teste Gate.io Spot
    results.gateioSpot = await testGateioSpot();
    
    // Teste MEXC Futures
    results.mexcFutures = await testMexcFutures();
    
    // Resultados finais
    console.log('\n📊 RESULTADOS DOS TESTES:');
    console.log('=' * 50);
    console.log(`Gate.io Spot: ${results.gateioSpot ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    console.log(`MEXC Futures: ${results.mexcFutures ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    console.log(`APIs REST: ${results.restApis ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    
    const allWorking = results.gateioSpot && results.mexcFutures && results.restApis;
    console.log(`\n${allWorking ? '🎉 TODOS OS TESTES PASSARAM!' : '⚠️ ALGUNS TESTES FALHARAM'}`);
    
    if (allWorking) {
        console.log('✅ As WebSockets estão prontas para uso no sistema de arbitragem!');
    } else {
        console.log('❌ Há problemas de conectividade que precisam ser resolvidos.');
    }
    
    process.exit(allWorking ? 0 : 1);
}

// Executar testes
runTests().catch((error) => {
    console.error('❌ Erro fatal nos testes:', error);
    process.exit(1);
}); 