const { Pool } = require('pg');
const fetch = require('node-fetch');

// URL do banco
const DATABASE_URL = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

// Pares monitorados (lista específica fornecida pelo usuário)
const MONITORED_PAIRS = [
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

// Função para buscar preços do Gate.io
async function fetchGateioPrices(symbols) {
  try {
    const response = await fetch('https://api.gateio.ws/api/v4/spot/tickers');
    const data = await response.json();
    
    const prices = {};
    data.forEach(ticker => {
      if (symbols.includes(ticker.currency_pair)) {
        prices[ticker.currency_pair] = {
          ask: parseFloat(ticker.lowest_ask),
          bid: parseFloat(ticker.highest_bid),
          last: parseFloat(ticker.last)
        };
      }
    });
    
    return prices;
  } catch (error) {
    console.error('Erro ao buscar preços do Gate.io:', error);
    return {};
  }
}

// Função para buscar preços do MEXC (corrigida)
async function fetchMexcPrices(symbols) {
  try {
    // Buscar tickers individuais do MEXC
    const prices = {};
    
    for (const symbol of symbols.slice(0, 20)) { // Limitar a 20 para evitar rate limit
      try {
        const response = await fetch(`https://www.mexc.com/api/platform/spot/market/ticker?symbol=${symbol}`);
        const data = await response.json();
        
        if (data && data.data) {
          prices[symbol] = {
            ask: parseFloat(data.data.ask),
            bid: parseFloat(data.data.bid),
            last: parseFloat(data.data.last)
          };
        }
        
        // Pequeno delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`Erro ao buscar ${symbol} do MEXC:`, error.message);
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Erro ao buscar preços do MEXC:', error);
    return {};
  }
}

// Função para calcular spread
function calculateSpread(spotPrice, futuresPrice) {
  if (!spotPrice || !futuresPrice || spotPrice <= 0 || futuresPrice <= 0) {
    return null;
  }
  return ((futuresPrice - spotPrice) / spotPrice) * 100;
}

// Função para salvar dados no banco
async function saveToDatabase(opportunities, pool) {
  if (opportunities.length === 0) return;
  
  try {
    for (const opp of opportunities) {
      await pool.query(`
        INSERT INTO "SpreadHistory" (
          symbol, spread, "spotPrice", "futuresPrice", 
          "exchangeBuy", "exchangeSell", direction, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        opp.symbol,
        opp.spread,
        opp.spotPrice,
        opp.futuresPrice,
        opp.exchangeBuy,
        opp.exchangeSell,
        opp.direction,
        new Date()
      ]);
    }
    
    console.log(`✅ ${opportunities.length} oportunidades salvas no banco`);
  } catch (error) {
    console.error('Erro ao salvar no banco:', error);
  }
}

// Função principal
async function fetchRealTimeData() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Iniciando busca de dados em tempo real...');
    console.log(`📊 Monitorando ${MONITORED_PAIRS.length} pares`);
    
    // Buscar preços das exchanges
    console.log('📡 Buscando preços do Gate.io...');
    const gateioPrices = await fetchGateioPrices(MONITORED_PAIRS);
    console.log(`✅ Gate.io: ${Object.keys(gateioPrices).length} pares encontrados`);
    
    console.log('📡 Buscando preços do MEXC...');
    const mexcPrices = await fetchMexcPrices(MONITORED_PAIRS);
    console.log(`✅ MEXC: ${Object.keys(mexcPrices).length} pares encontrados`);
    
    // Mostrar alguns preços encontrados
    console.log('\n📊 Exemplos de preços encontrados:');
    const gateioExamples = Object.keys(gateioPrices).slice(0, 5);
    gateioExamples.forEach(symbol => {
      const price = gateioPrices[symbol];
      console.log(`Gate.io ${symbol}: $${price.last} (Ask: $${price.ask}, Bid: $${price.bid})`);
    });
    
    const mexcExamples = Object.keys(mexcPrices).slice(0, 5);
    mexcExamples.forEach(symbol => {
      const price = mexcPrices[symbol];
      console.log(`MEXC ${symbol}: $${price.last} (Ask: $${price.ask}, Bid: $${price.bid})`);
    });
    
    // Analisar oportunidades de arbitragem
    const opportunities = [];
    
    for (const symbol of MONITORED_PAIRS) {
      const gateio = gateioPrices[symbol];
      const mexc = mexcPrices[symbol];
      
      if (gateio && mexc) {
        // Calcular spreads
        const spread1 = calculateSpread(gateio.last, mexc.last); // Gate.io spot -> MEXC futures
        const spread2 = calculateSpread(mexc.last, gateio.last); // MEXC spot -> Gate.io futures
        
        if (spread1 && Math.abs(spread1) > 0.1) {
          opportunities.push({
            symbol,
            spread: Math.abs(spread1),
            spotPrice: gateio.last,
            futuresPrice: mexc.last,
            exchangeBuy: spread1 > 0 ? 'gateio' : 'mexc',
            exchangeSell: spread1 > 0 ? 'mexc' : 'gateio',
            direction: 'spot_to_futures'
          });
        }
        
        if (spread2 && Math.abs(spread2) > 0.1) {
          opportunities.push({
            symbol,
            spread: Math.abs(spread2),
            spotPrice: mexc.last,
            futuresPrice: gateio.last,
            exchangeBuy: spread2 > 0 ? 'mexc' : 'gateio',
            exchangeSell: spread2 > 0 ? 'gateio' : 'mexc',
            direction: 'spot_to_futures'
          });
        }
      }
    }
    
    console.log(`\n🎯 Encontradas ${opportunities.length} oportunidades de arbitragem`);
    
    // Mostrar melhores oportunidades
    const sortedOpportunities = opportunities
      .sort((a, b) => b.spread - a.spread)
      .slice(0, 10);
    
    if (sortedOpportunities.length > 0) {
      console.log('\n🏆 Top 10 oportunidades:');
      sortedOpportunities.forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.symbol}: ${opp.spread.toFixed(4)}% - Spot: $${opp.spotPrice} - Futures: $${opp.futuresPrice} - ${opp.exchangeBuy} → ${opp.exchangeSell}`);
      });
      
      // Salvar no banco
      await saveToDatabase(opportunities, pool);
    } else {
      console.log('\n⚠️ Nenhuma oportunidade de arbitragem encontrada com spread > 0.1%');
    }
    
  } catch (error) {
    console.error('❌ Erro na busca de dados:', error);
  } finally {
    await pool.end();
  }
}

// Executar
fetchRealTimeData(); 