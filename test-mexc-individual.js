// TESTE INDIVIDUAL DA WEBSOCKET MEXC FUTURES
// Este arquivo testa especificamente a conexão MEXC Futures

const WebSocket = require('ws');
const fetch = require('node-fetch');

// Configurações
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';
const MEXC_REST_URL = 'https://contract.mexc.com/api/v1/contract/detail';

console.log('🔍 TESTE INDIVIDUAL MEXC FUTURES');
console.log('=' * 50);

// Teste da API REST primeiro
async function testMexcRestApi() {
    console.log('\n📡 Testando API REST MEXC...');
    
    try {
        const response = await fetch(MEXC_REST_URL);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            console.log(`✅ MEXC API: ${data.length} contratos encontrados`);
            
            // Filtrar apenas contratos USDT
            const usdtContracts = data.filter(contract => 
                contract.state === 'ENABLED' && 
                contract.symbol.endsWith('_USDT')
            );
            
            console.log(`✅ MEXC API: ${usdtContracts.length} contratos USDT ativos`);
            
            if (usdtContracts.length > 0) {
                console.log('📊 Primeiros 10 contratos USDT:');
                usdtContracts.slice(0, 10).forEach(contract => {
                    console.log(`  - ${contract.symbol} (${contract.state})`);
                });
            }
            
            return usdtContracts.map(c => c.symbol.replace('_', '/'));
        } else {
            console.log('❌ MEXC API: Resposta não é um array');
            console.log('Resposta:', JSON.stringify(data).substring(0, 200) + '...');
            return [];
        }
    } catch (error) {
        console.error('❌ Erro ao testar MEXC API:', error.message);
        return [];
    }
}

// Teste da WebSocket MEXC
async function testMexcWebSocket() {
    console.log('\n🔌 Testando WebSocket MEXC Futures...');
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(MEXC_FUTURES_WS_URL, {
            handshakeTimeout: 10000,
            timeout: 10000
        });
        
        let connected = false;
        let receivedData = false;
        let testSymbols = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];
        let receivedSymbols = new Set();
        
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('❌ MEXC WebSocket: Timeout na conexão');
                ws.close();
                resolve({ success: false, reason: 'timeout_connection' });
            } else if (!receivedData) {
                console.log('❌ MEXC WebSocket: Conexão estabelecida mas sem dados');
                ws.close();
                resolve({ success: false, reason: 'no_data' });
            }
        }, 15000);
        
        ws.on('open', () => {
            console.log('✅ MEXC WebSocket: Conexão estabelecida');
            connected = true;
            
            // Enviar subscrições para os símbolos de teste
            setTimeout(() => {
                testSymbols.forEach((symbol, index) => {
                    setTimeout(() => {
                        const subscribeMsg = {
                            method: "sub.ticker",
                            param: { symbol: symbol }
                        };
                        
                        ws.send(JSON.stringify(subscribeMsg));
                        console.log(`📤 MEXC WebSocket: Subscrição enviada para ${symbol}`);
                    }, index * 500); // Delay de 500ms entre subscrições
                });
            }, 1000);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                // Log da mensagem para debug
                console.log(`📨 MEXC WebSocket: Mensagem recebida:`, JSON.stringify(message).substring(0, 200));
                
                // Handle pong response
                if (message.method === 'pong') {
                    console.log('✅ MEXC WebSocket: Pong recebido');
                    return;
                }
                
                // Handle subscription confirmation
                if (message.op === 'sub' && message.status === 'ok') {
                    console.log(`✅ MEXC WebSocket: Subscrição confirmada para: ${message.symbol}`);
                    return;
                }
                
                // Handle ticker data
                if (message.channel === 'push.ticker' && message.data) {
                    const symbol = message.data.symbol;
                    const bestAsk = parseFloat(message.data.ask1);
                    const bestBid = parseFloat(message.data.bid1);
                    
                    if (bestAsk && bestBid && bestAsk > 0 && bestBid > 0) {
                        console.log(`✅ MEXC WebSocket: Dados recebidos - ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
                        receivedSymbols.add(symbol);
                        receivedData = true;
                        
                        // Se recebemos dados de todos os símbolos de teste, consideramos sucesso
                        if (receivedSymbols.size >= testSymbols.length) {
                            clearTimeout(timeout);
                            ws.close();
                            resolve({ 
                                success: true, 
                                symbols: Array.from(receivedSymbols),
                                data: { bestAsk, bestBid }
                            });
                        }
                    }
                }
                
                // Handle error messages
                if (message.error) {
                    console.error(`❌ MEXC WebSocket: Erro na mensagem:`, message.error);
                }
                
            } catch (error) {
                console.error('❌ MEXC WebSocket: Erro ao processar mensagem:', error);
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ MEXC WebSocket: Erro na conexão:', error.message);
            clearTimeout(timeout);
            resolve({ success: false, reason: 'connection_error', error: error.message });
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 MEXC WebSocket: Conexão fechada - Código: ${code}, Razão: ${reason}`);
            clearTimeout(timeout);
            
            if (receivedData) {
                resolve({ 
                    success: true, 
                    symbols: Array.from(receivedSymbols),
                    reason: 'connection_closed'
                });
            } else {
                resolve({ success: false, reason: 'connection_closed' });
            }
        });
    });
}

// Teste de ping/pong
async function testMexcPingPong() {
    console.log('\n🏓 Testando Ping/Pong MEXC...');
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(MEXC_FUTURES_WS_URL);
        let pongReceived = false;
        
        const timeout = setTimeout(() => {
            if (!pongReceived) {
                console.log('❌ MEXC Ping/Pong: Timeout - Pong não recebido');
                ws.close();
                resolve({ success: false, reason: 'ping_pong_timeout' });
            }
        }, 10000);
        
        ws.on('open', () => {
            console.log('✅ MEXC Ping/Pong: Conexão estabelecida');
            
            // Enviar ping
            const pingMessage = { "method": "ping" };
            ws.send(JSON.stringify(pingMessage));
            console.log('📤 MEXC Ping/Pong: Ping enviado');
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (message.method === 'pong') {
                    console.log('✅ MEXC Ping/Pong: Pong recebido');
                    pongReceived = true;
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ success: true });
                }
            } catch (error) {
                console.error('❌ MEXC Ping/Pong: Erro ao processar mensagem:', error);
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ MEXC Ping/Pong: Erro na conexão:', error.message);
            clearTimeout(timeout);
            resolve({ success: false, reason: 'connection_error', error: error.message });
        });
        
        ws.on('close', () => {
            console.log('🔌 MEXC Ping/Pong: Conexão fechada');
            clearTimeout(timeout);
            
            if (pongReceived) {
                resolve({ success: true });
            } else {
                resolve({ success: false, reason: 'connection_closed' });
            }
        });
    });
}

// Função principal de teste
async function runMexcTests() {
    console.log('🚀 INICIANDO TESTES INDIVIDUAIS MEXC FUTURES...');
    console.log('=' * 50);
    
    const results = {
        restApi: false,
        webSocket: false,
        pingPong: false
    };
    
    // 1. Teste API REST
    console.log('\n📡 TESTE 1: API REST');
    const restPairs = await testMexcRestApi();
    results.restApi = restPairs.length > 0;
    
    // 2. Teste Ping/Pong
    console.log('\n🏓 TESTE 2: PING/PONG');
    const pingPongResult = await testMexcPingPong();
    results.pingPong = pingPongResult.success;
    
    // 3. Teste WebSocket com dados
    console.log('\n🔌 TESTE 3: WEBSOCKET COM DADOS');
    const wsResult = await testMexcWebSocket();
    results.webSocket = wsResult.success;
    
    // Resultados finais
    console.log('\n📊 RESULTADOS DOS TESTES MEXC:');
    console.log('=' * 50);
    console.log(`API REST: ${results.restApi ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    console.log(`Ping/Pong: ${results.pingPong ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    console.log(`WebSocket: ${results.webSocket ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    
    if (results.webSocket && wsResult.symbols) {
        console.log(`📊 Símbolos recebidos: ${wsResult.symbols.join(', ')}`);
    }
    
    const allWorking = results.restApi && results.pingPong && results.webSocket;
    console.log(`\n${allWorking ? '🎉 TODOS OS TESTES MEXC PASSARAM!' : '⚠️ ALGUNS TESTES MEXC FALHARAM'}`);
    
    if (allWorking) {
        console.log('✅ A WebSocket MEXC está pronta para uso no sistema de arbitragem!');
    } else {
        console.log('❌ Há problemas na WebSocket MEXC que precisam ser resolvidos.');
        
        if (!results.restApi) {
            console.log('💡 Problema: API REST não está respondendo corretamente');
        }
        if (!results.pingPong) {
            console.log('💡 Problema: Ping/Pong não está funcionando');
        }
        if (!results.webSocket) {
            console.log('💡 Problema: WebSocket não está recebendo dados');
        }
    }
    
    return allWorking;
}

// Executar testes
runMexcTests().then((success) => {
    process.exit(success ? 0 : 1);
}).catch((error) => {
    console.error('❌ Erro fatal nos testes MEXC:', error);
    process.exit(1);
}); 