const WebSocket = require('ws');
const fetch = require('node-fetch');

// Configurações
const GATEIO_WS_URL = 'wss://api.gateio.ws/ws/v4/';
const MEXC_FUTURES_WS_URL = 'wss://contract.mexc.com/edge';
const MIN_SPREAD_THRESHOLD = 0.001; // 0.001% para teste (muito baixo)

// Armazenamento de preços
const priceData = {
  gateio_spot: {},
  mexc_futures: {}
};

// Função para calcular oportunidades
function calculateArbitrageOpportunities() {
  const opportunities = [];
  const symbols = Object.keys(priceData.gateio_spot);

  console.log(`🧮 Calculando oportunidades com spread mínimo: ${MIN_SPREAD_THRESHOLD}%`);

  for (const symbol of symbols) {
    try {
      const gateioSpot = priceData.gateio_spot[symbol];
      const mexcFutures = priceData.mexc_futures[symbol];

      if (!gateioSpot || !mexcFutures) {
        continue;
      }

      // ESTRATÉGIA: COMPRAR Gate.io SPOT, VENDER MEXC FUTURES
      const spotPrice = gateioSpot.bestAsk; // Preço de compra no spot
      const futuresPrice = mexcFutures.bestBid; // Preço de venda no futures
      
      if (spotPrice > 0 && futuresPrice > 0) {
        // Fórmula: spread (%) = ((preço futuro - preço spot) / preço spot) × 100
        const spread = ((futuresPrice - spotPrice) / spotPrice) * 100;
        
        console.log(`📈 ${symbol}: Compra Spot=${spotPrice}, Venda Futures=${futuresPrice}, Spread=${spread.toFixed(6)}%`);
        
        if (Math.abs(spread) >= MIN_SPREAD_THRESHOLD) {
          const opportunity = {
            type: 'arbitrage',
            baseSymbol: symbol.replace('_USDT', ''),
            profitPercentage: spread,
            buyAt: {
              exchange: 'gateio',
              price: spotPrice,
              marketType: 'spot'
            },
            sellAt: {
              exchange: 'mexc',
              price: futuresPrice,
              marketType: 'futures'
            },
            arbitrageType: 'spot_to_futures',
            timestamp: Date.now()
          };
          
          opportunities.push(opportunity);
          console.log(`✅ OPORTUNIDADE VÁLIDA: ${symbol} - ${spread.toFixed(6)}% (Compra: ${spotPrice}, Venda: ${futuresPrice})`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao calcular oportunidade para ${symbol}:`, error);
    }
  }

  return opportunities;
}

// Teste Gate.io Spot
async function testGateioSpot() {
  console.log('🔌 Testando Gate.io SPOT...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(GATEIO_WS_URL);
    
    ws.on('open', () => {
      console.log('✅ Gate.io SPOT conectado!');
      
      // Lista completa de pares Gate.io conforme especificado
      const symbols = [
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
      
      symbols.forEach(symbol => {
        const msg = {
          id: Date.now(),
          time: Date.now(),
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
        
        if (message.event === 'update' && message.result && message.channel === 'spot.tickers') {
          const ticker = message.result;
          const symbol = ticker.currency_pair;
          const bestAsk = parseFloat(ticker.lowest_ask);
          const bestBid = parseFloat(ticker.highest_bid);
          
          if (bestAsk && bestBid && bestAsk > 0 && bestBid > 0) {
            priceData.gateio_spot[symbol] = { bestAsk, bestBid };
            console.log(`💰 Gate.io SPOT ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem Gate.io:', error);
      }
    });

    // Aguardar 10 segundos e fechar
    setTimeout(() => {
      ws.close();
      resolve();
    }, 10000);
  });
}

// Teste MEXC Futures
async function testMexcFutures() {
  console.log('🔌 Testando MEXC Futures...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(MEXC_FUTURES_WS_URL);
    
    ws.on('open', () => {
      console.log('✅ MEXC Futures conectado!');
      
      // Lista completa de pares MEXC conforme especificado
      const symbols = [
        '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
        'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
        'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'CUDIS_USDT', 'DADDY_USDT', 'DAG_USDT',
        'DEGEN_USDT', 'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'ENJ_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT',
        'WMTX_USDT', 'PIN_USDT', 'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT',
        'TARA_USDT', 'BERT_USDT', 'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT',
        'RBNT_USDT', 'TOMI_USDT', 'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT',
        'ALPINE_USDT', 'CITY_USDT', 'ILV_USDT', 'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'ALICE_USDT', 'SYS_USDT', 'PSG_USDT',
        'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT', 'REX_USDT', 'LUNAI_USDT', 'MORE_USDT', 'B_USDT', 'RED_USDT', 'GTC_USDT',
        'TALE_USDT', 'RWA_USDT', 'MGO_USDT', 'CESS_USDT', 'QUBIC_USDT', 'TEL_USDT', 'SHM_USDT', 'DOLO_USDT', 'LABUBU_USDT',
        'ZIG_USDT', 'BAR_USDT', 'GROK_USDT', 'MASA_USDT', 'XEM_USDT', 'ULTI_USDT', 'LUMIA_USDT', 'PONKE_USDT'
      ];
      
      symbols.forEach(symbol => {
        const msg = {
          method: "sub.ticker",
          param: { symbol: symbol }
        };
        
        ws.send(JSON.stringify(msg));
        console.log(`📤 MEXC Futures: ${symbol}`);
      });
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 MEXC Mensagem:`, JSON.stringify(message).substring(0, 200));
        
        if (message.symbol && message.data) {
          const symbol = message.symbol;
          const lastPrice = parseFloat(message.data.lastPrice);
          const fairPrice = parseFloat(message.data.fairPrice);
          
          // Usar fairPrice como preço de venda (futures)
          const bestBid = fairPrice || lastPrice;
          
          if (bestBid && bestBid > 0) {
            priceData.mexc_futures[symbol] = { bestAsk: bestBid, bestBid: bestBid };
            console.log(`💰 MEXC Futures ${symbol}: Price=${bestBid}`);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem MEXC:', error);
      }
    });

    // Aguardar 10 segundos e fechar
    setTimeout(() => {
      ws.close();
      resolve();
    }, 10000);
  });
}

// Teste principal
async function runTest() {
  console.log('🧪 TESTE COM SPREAD BAIXO - ARBITRAGEM GATE.IO SPOT vs MEXC FUTURES');
  console.log('='.repeat(70));
  
  // Testar Gate.io Spot
  await testGateioSpot();
  
  // Testar MEXC Futures
  await testMexcFutures();
  
  // Aguardar um pouco para processar dados
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n📊 DADOS COLETADOS:');
  console.log('Gate.io Spot:', Object.keys(priceData.gateio_spot));
  console.log('MEXC Futures:', Object.keys(priceData.mexc_futures));
  
  // Calcular oportunidades
  console.log('\n🧮 Calculando oportunidades de arbitragem...');
  const opportunities = calculateArbitrageOpportunities();
  
  console.log('\n📊 RESULTADO DO TESTE:');
  console.log('='.repeat(50));
  console.log(`Oportunidades encontradas: ${opportunities.length}`);
  
  if (opportunities.length > 0) {
    console.log('\n🎯 OPORTUNIDADES VÁLIDAS:');
    opportunities.forEach(opp => {
      console.log(`✅ ${opp.baseSymbol}: ${opp.profitPercentage.toFixed(6)}%`);
      console.log(`   Compra: ${opp.buyAt.exchange} ${opp.buyAt.marketType} @ ${opp.buyAt.price}`);
      console.log(`   Venda: ${opp.sellAt.exchange} ${opp.sellAt.marketType} @ ${opp.sellAt.price}`);
    });
  } else {
    console.log('❌ Nenhuma oportunidade encontrada com spread mínimo de', MIN_SPREAD_THRESHOLD + '%');
  }
  
  console.log('\n🏁 TESTE CONCLUÍDO');
}

runTest().catch(console.error); 