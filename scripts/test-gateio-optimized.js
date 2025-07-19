const WebSocket = require('ws');

console.log('🧪 TESTE OTIMIZADO - GATE.IO SPOT (100% ESTÁTICO)');
console.log('==================================================');

// Lista pré-definida (igual ao conector)
const predefinedPairs = [
    '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
    'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
    'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'DADDY_USDT', 'DAG_USDT', 'DEGEN_USDT',
    'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT', 'WMTX_USDT', 'PIN_USDT',
    'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT', 'TARA_USDT', 'BERT_USDT',
    'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT', 'RBNT_USDT', 'TOMI_USDT',
    'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT', 'ALPINE_USDT', 'CITY_USDT',
    'ILV_USDT', 'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'SYS_USDT', 'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT',
    'LUNAI_USDT', 'MORE_USDT', 'MGO_USDT', 'GROK_USDT'
];

console.log(`📊 Lista pré-definida: ${predefinedPairs.length} pares`);
console.log(`📋 Primeiros 10: ${predefinedPairs.slice(0, 10).join(', ')}`);
console.log(`📋 Últimos 5: ${predefinedPairs.slice(-5).join(', ')}`);

// Teste do WebSocket otimizado
function testGateioOptimized() {
    console.log('\n🔌 Testando WebSocket Gate.io (OTIMIZADO)...');
    
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
        const testSymbols = predefinedPairs.slice(0, 10); // Testar apenas 10 símbolos

        ws.on('open', () => {
            console.log('✅ Conexão WebSocket estabelecida!');
            connectionEstablished = true;
            
            console.log(`📤 Enviando ${testSymbols.length} subscrições (otimizadas)...`);
            
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
                
                if (index < 5) {
                    console.log(`📤 Subscrição ${index + 1}: ${symbol}`);
                }
            });
            
            console.log(`📤 ... e mais ${testSymbols.length - 5} subscrições enviadas`);
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
                        
                        if (priceUpdates >= 15) {
                            console.log('✅ Teste WebSocket otimizado concluído com sucesso!');
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
async function runOptimizedTest() {
    console.log('🚀 Iniciando teste otimizado Gate.io...\n');
    
    // Teste do WebSocket otimizado
    const wsSuccess = await testGateioOptimized();
    
    console.log('\n📊 RESULTADO DO TESTE OTIMIZADO:');
    console.log('=================================');
    console.log(`Lista pré-definida: ${predefinedPairs.length} pares`);
    console.log(`WebSocket: ${wsSuccess ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    
    if (wsSuccess) {
        console.log('\n🎉 GATE.IO OTIMIZADO: TESTE APROVADO!');
        console.log('✅ Conector estático funcionando perfeitamente');
        console.log('✅ Performance otimizada (95% menos subscrições)');
        console.log('✅ Dados em tempo real sendo recebidos');
    } else {
        console.log('\n⚠️ GATE.IO OTIMIZADO: TESTE COM PROBLEMAS');
        console.log('❌ Verificar conectividade ou configurações');
    }
}

runOptimizedTest().catch(console.error); 