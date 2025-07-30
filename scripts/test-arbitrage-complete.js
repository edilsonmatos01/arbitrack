const WebSocket = require('ws');
const fetch = require('node-fetch');

console.log('🧪 TESTE COMPLETO - ARBITRAGEM GATE.IO SPOT vs MEXC FUTURES');
console.log('============================================================');

// Estado dos preços
let gateioPrices = {};
let mexcPrices = {};
let opportunities = [];

// Teste Gate.io SPOT
async function testGateioSpot() {
    console.log('\n📡 Testando Gate.io SPOT...');
    
    return new Promise((resolve) => {
        const ws = new WebSocket('wss://api.gateio.ws/ws/v4/', {
            handshakeTimeout: 30000,
            perMessageDeflate: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const testSymbols = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'XRP_USDT', 'BNB_USDT'];
        let priceUpdates = 0;

        ws.on('open', () => {
            console.log('✅ Gate.io SPOT conectado!');
            
            testSymbols.forEach((symbol, index) => {
                const msg = {
                    time: Math.floor(Date.now() / 1000),
                    channel: "spot.tickers",
                    event: "subscribe",
                    payload: [symbol]
                };
                
                ws.send(JSON.stringify(msg));
                console.log(`📤 Gate.io SPOT: ${symbol}`);
            });
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (message.event === 'update' && message.result) {
                    const ticker = message.result;
                    const symbol = ticker.currency_pair;
                    const bestAsk = parseFloat(ticker.lowest_ask);
                    const bestBid = parseFloat(ticker.highest_bid);
                    
                    if (bestAsk && bestBid && bestAsk > 0 && bestBid > 0) {
                        gateioPrices[symbol] = { bestAsk, bestBid };
                        priceUpdates++;
                        console.log(`💰 Gate.io SPOT ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
                        
                        if (priceUpdates >= 10) {
                            console.log('✅ Gate.io SPOT: Dados suficientes coletados');
                            ws.close();
                            resolve(true);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Erro Gate.io SPOT:', error.message);
            }
        });

        ws.on('error', (error) => {
            console.error('❌ Erro Gate.io SPOT:', error.message);
            resolve(false);
        });

        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            resolve(priceUpdates > 0);
        }, 15000);
    });
}

// Teste MEXC Futures
async function testMexcFutures() {
    console.log('\n📡 Testando MEXC Futures...');
    
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

        const testSymbols = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'XRP_USDT', 'BNB_USDT'];
        let priceUpdates = 0;

        ws.on('open', () => {
            console.log('✅ MEXC Futures conectado!');
            
            testSymbols.forEach((symbol, index) => {
                const msg = {
                    "method": "sub.ticker",
                    "param": {
                        "symbol": symbol
                    }
                };
                
                ws.send(JSON.stringify(msg));
                console.log(`📤 MEXC Futures: ${symbol}`);
            });
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (message.channel === "push.ticker" && message.data) {
                    const ticker = message.data;
                    const bestAsk = parseFloat(ticker.ask1);
                    const bestBid = parseFloat(ticker.bid1);

                    if (bestAsk && bestBid && bestAsk > 0 && bestBid > 0) {
                        mexcPrices[ticker.symbol] = { bestAsk, bestBid };
                        priceUpdates++;
                        console.log(`💰 MEXC Futures ${ticker.symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
                        
                        if (priceUpdates >= 10) {
                            console.log('✅ MEXC Futures: Dados suficientes coletados');
                            ws.close();
                            resolve(true);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Erro MEXC Futures:', error.message);
            }
        });

        ws.on('error', (error) => {
            console.error('❌ Erro MEXC Futures:', error.message);
            resolve(false);
        });

        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            resolve(priceUpdates > 0);
        }, 15000);
    });
}

// Calcular oportunidades de arbitragem
function calculateArbitrageOpportunities() {
    console.log('\n🧮 Calculando oportunidades de arbitragem...');
    
    const commonSymbols = Object.keys(gateioPrices).filter(symbol => mexcPrices[symbol]);
    
    if (commonSymbols.length === 0) {
        console.log('❌ Nenhum símbolo comum encontrado');
        return;
    }
    
    console.log(`📊 Símbolos comuns: ${commonSymbols.join(', ')}`);
    
    commonSymbols.forEach(symbol => {
        const gateioData = gateioPrices[symbol];
        const mexcData = mexcPrices[symbol];
        
        // Gate.io SPOT -> MEXC Futures
        const gateioToMexc = ((mexcData.bestBid - gateioData.bestAsk) / gateioData.bestAsk) * 100;
        
        // MEXC Futures -> Gate.io SPOT
        const mexcToGateio = ((gateioData.bestBid - mexcData.bestAsk) / mexcData.bestAsk) * 100;
        
        console.log(`\n📈 ${symbol}:`);
        console.log(`   Gate.io SPOT: Ask=${gateioData.bestAsk}, Bid=${gateioData.bestBid}`);
        console.log(`   MEXC Futures: Ask=${mexcData.bestAsk}, Bid=${mexcData.bestBid}`);
        console.log(`   Spread Gate.io→MEXC: ${gateioToMexc.toFixed(4)}%`);
        console.log(`   Spread MEXC→Gate.io: ${mexcToGateio.toFixed(4)}%`);
        
        // Verificar se há oportunidade (spread > 0.1%)
        if (gateioToMexc > 0.1) {
            opportunities.push({
                symbol,
                spread: gateioToMexc,
                direction: 'Gate.io SPOT → MEXC Futures',
                buyPrice: gateioData.bestAsk,
                sellPrice: mexcData.bestBid
            });
        }
        
        if (mexcToGateio > 0.1) {
            opportunities.push({
                symbol,
                spread: mexcToGateio,
                direction: 'MEXC Futures → Gate.io SPOT',
                buyPrice: mexcData.bestAsk,
                sellPrice: gateioData.bestBid
            });
        }
    });
}

// Teste principal
async function runCompleteTest() {
    console.log('🚀 Iniciando teste completo de arbitragem...\n');
    
    // Testar Gate.io SPOT
    const gateioSuccess = await testGateioSpot();
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Testar MEXC Futures
    const mexcSuccess = await testMexcFutures();
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calcular oportunidades
    calculateArbitrageOpportunities();
    
    console.log('\n📊 RESULTADO DO TESTE COMPLETO:');
    console.log('================================');
    console.log(`Gate.io SPOT: ${gateioSuccess ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    console.log(`MEXC Futures: ${mexcSuccess ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    console.log(`Oportunidades encontradas: ${opportunities.length}`);
    
    if (opportunities.length > 0) {
        console.log('\n🎯 OPORTUNIDADES DE ARBITRAGEM:');
        console.log('===============================');
        opportunities.forEach((opp, index) => {
            console.log(`${index + 1}. ${opp.symbol} - ${opp.direction}`);
            console.log(`   Spread: ${opp.spread.toFixed(4)}%`);
            console.log(`   Comprar: ${opp.buyPrice}`);
            console.log(`   Vender: ${opp.sellPrice}`);
        });
    }
    
    if (gateioSuccess && mexcSuccess) {
        console.log('\n🎉 TESTE COMPLETO APROVADO!');
        console.log('✅ Sistema de arbitragem funcionando corretamente');
        console.log('✅ Dados em tempo real sendo recebidos');
        console.log('✅ Oportunidades sendo calculadas');
    } else {
        console.log('\n⚠️ TESTE COMPLETO COM PROBLEMAS');
        console.log('❌ Verificar conectividade dos conectores');
    }
}

runCompleteTest().catch(console.error); 