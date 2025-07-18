import { NextResponse } from 'next/server';
import ccxt, { Exchange } from 'ccxt';
import { SupportedExchangeId } from '@/lib/exchangeUtils';
import { recordSpread } from '@/lib/spread-tracker';

// Cache em memória otimizado para oportunidades
class OpportunityCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 500;

  set(key: string, data: any, ttl: number = 30 * 1000) { // 30 segundos para dados em tempo real
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }
}

const opportunityCache = new OpportunityCache();

// Rate limiting para evitar sobrecarga das APIs das exchanges
class RateLimiter {
  private requests = new Map<string, number[]>();
  private maxRequests = 10; // Máximo de requisições por minuto
  private windowMs = 60 * 1000; // Janela de 1 minuto

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }

    const requestTimes = this.requests.get(key)!;
    const recentRequests = requestTimes.filter(time => time > windowStart);
    
    if (recentRequests.length < this.maxRequests) {
      recentRequests.push(now);
      this.requests.set(key, recentRequests);
      return true;
    }

    return false;
  }
}

const rateLimiter = new RateLimiter();

// Lista otimizada de pares - apenas os mais líquidos
const TARGET_PAIRS = [
  'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 
  'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'MATIC/USDT', 'LTC/USDT', 
  'TRX/USDT', 'SHIB/USDT', 'ATOM/USDT', 'LINK/USDT', 'NEAR/USDT', 
  'APT/USDT', 'ARB/USDT', 'FIL/USDT', 'SAND/USDT', 'AAVE/USDT',
  'UNI/USDT', 'SUI/USDT', 'ONDO/USDT', 'WLD/USDT', 'FET/USDT',
  'ARKM/USDT', 'INJ/USDT', 'TON/USDT', 'OP/USDT', 'KAS/USDT', 'VR/USDT'
];

// Helper para validar se a string é uma SupportedExchangeId
function isValidSupportedExchangeId(id: string): id is SupportedExchangeId {
  return ['gateio', 'mexc'].includes(id);
}

// Helper para obter uma instância da CCXT de forma segura
function getCcxtInstance(exchangeId: SupportedExchangeId): Exchange | null {
  if (!ccxt.exchanges.includes(exchangeId)) {
    console.error(`Inter-Exchange: CCXT exchange ID '${exchangeId}' não é válida ou disponível.`);
    return null;
  }
  const ExchangeConstructor = ccxt[exchangeId as keyof typeof ccxt] as typeof Exchange;
  if (typeof ExchangeConstructor !== 'function') {
    console.error(`Inter-Exchange: Construtor CCXT não encontrado para ID: ${exchangeId}`);
    return null;
  }
  return new ExchangeConstructor({ 
    enableRateLimit: true,
    rateLimit: 1000 // 1 requisição por segundo
  });
}

function mapDirectionToTracker(apiDirection: 'FUTURES_TO_SPOT' | 'SPOT_TO_FUTURES'): 'spot-to-future' | 'future-to-spot' {
  return apiDirection === 'FUTURES_TO_SPOT' ? 'spot-to-future' : 'future-to-spot';
}

// Função otimizada para buscar dados de um par
async function fetchPairData(
  pairInfo: { marketSymbol: string },
  spotEx: Exchange,
  futEx: Exchange,
  spotExchangeId: string,
  futuresExchangeId: string,
  requestedDirection?: string
) {
  try {
    // Verificar rate limiting
    if (!rateLimiter.canMakeRequest(`${spotExchangeId}_${futuresExchangeId}`)) {
      console.warn(`Rate limit atingido para ${spotExchangeId}_${futuresExchangeId}`);
      return null;
    }

    const [spotTicker, futuresTicker] = await Promise.all([
      spotEx.fetchTicker(pairInfo.marketSymbol),
      futEx.fetchTicker(pairInfo.marketSymbol)
    ]);

    let fundingRate = "0";
    try {
      const fundingRateData = await futEx.fetchFundingRate(pairInfo.marketSymbol);
      if (typeof fundingRateData?.fundingRate === 'number') {
        fundingRate = fundingRateData.fundingRate.toString();
      }
    } catch (frError) {
      console.warn(`Inter-Exchange (${futuresExchangeId}) - Não foi possível buscar funding rate para ${pairInfo.marketSymbol}`);
    }

    const spotAsk = spotTicker.ask;
    const spotBid = spotTicker.bid;
    const futuresAsk = futuresTicker.ask;
    const futuresBid = futuresTicker.bid;

    if (!spotAsk || !spotBid || !futuresAsk || !futuresBid || 
        spotAsk <= 0 || spotBid <= 0 || futuresAsk <= 0 || futuresBid <= 0) {
      return null;
    }

    // Calcular preços médios para comparação mais justa
    const spotMidPrice = (spotAsk + spotBid) / 2;
    const futuresMidPrice = (futuresAsk + futuresBid) / 2;

    // Fórmula simplificada: Spread (%) = ((Futures - Spot) / Spot) × 100
    const percentDiff = ((futuresMidPrice - spotMidPrice) / spotMidPrice) * 100;
    const calculatedApiDirection = percentDiff > 0 ? 'SPOT_TO_FUTURES' : 'FUTURES_TO_SPOT';

    if (requestedDirection && requestedDirection !== 'ALL' && calculatedApiDirection !== requestedDirection) {
      return null;
    }
    
    // Record spread for history (não bloquear a resposta)
    if (percentDiff !== 0) {
      recordSpread({
        symbol: pairInfo.marketSymbol,
        exchangeBuy: calculatedApiDirection === 'FUTURES_TO_SPOT' ? spotExchangeId : futuresExchangeId,
        exchangeSell: calculatedApiDirection === 'FUTURES_TO_SPOT' ? futuresExchangeId : spotExchangeId,
        direction: mapDirectionToTracker(calculatedApiDirection),
        spread: percentDiff
      }).catch(err => {
        console.error(`Inter-Exchange - Failed to record spread for ${pairInfo.marketSymbol}:`, err);
      });
    }

    return {
      symbol: pairInfo.marketSymbol,
      spotExchange: spotExchangeId,
      futuresExchange: futuresExchangeId,
      spotPrice: spotMidPrice.toString(),
      futuresPrice: futuresMidPrice.toString(),
      direction: calculatedApiDirection,
      fundingRate: fundingRate,
      percentDiff: Math.abs(percentDiff).toString(),
    };
  } catch (error) {
    console.error(`Inter-Exchange - Erro ao buscar dados para ${pairInfo.marketSymbol}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { spotExchange: spotExchangeIdString, futuresExchange: futuresExchangeIdString, direction: requestedDirection } = await req.json();

    if (!spotExchangeIdString || !futuresExchangeIdString) {
      return NextResponse.json({ error: 'spotExchange e futuresExchange são obrigatórios no corpo da requisição.' }, { status: 400 });
    }

    if (!isValidSupportedExchangeId(spotExchangeIdString) || !isValidSupportedExchangeId(futuresExchangeIdString)) {
      return NextResponse.json({ error: 'Valores inválidos para spotExchange ou futuresExchange.' }, { status: 400 });
    }

    const spotExchangeId: SupportedExchangeId = spotExchangeIdString;
    const futuresExchangeId: SupportedExchangeId = futuresExchangeIdString;

    // Verificar cache primeiro
    const cacheKey = `${spotExchangeId}_${futuresExchangeId}_${requestedDirection || 'ALL'}`;
    const cachedData = opportunityCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const spotEx = getCcxtInstance(spotExchangeId);
    const futEx = getCcxtInstance(futuresExchangeId);

    if (!spotEx || !futEx) {
      return NextResponse.json({ error: 'Falha ao instanciar uma ou ambas as exchanges.', details: `Spot: ${spotEx ? 'OK' : spotExchangeId}, Futures: ${futEx ? 'OK' : futuresExchangeId}` }, { status: 500 });
    }

    // Carregar mercados uma vez
    await Promise.all([spotEx.loadMarkets(), futEx.loadMarkets()]);
    
    // Filtrar pares válidos
    const validPairs = TARGET_PAIRS.filter(marketSymbol => {
      const spotMarket = spotEx.markets[marketSymbol];
      const futuresMarket = futEx.markets[marketSymbol];
      return spotMarket?.active !== false && futuresMarket?.active !== false;
    });

    if (validPairs.length === 0) {
      console.log(`Inter-Exchange (${spotExchangeId} / ${futuresExchangeId}) - Nenhum par válido encontrado.`);
      return NextResponse.json({ result: { list: [] }, retCode: 0, retMsg: 'OK, nenhum par encontrado' });
    }

    // Processar pares em lotes para melhor performance
    const batchSize = 5; // Processar 5 pares por vez
    const results = [];
    
    for (let i = 0; i < validPairs.length; i += batchSize) {
      const batch = validPairs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(marketSymbol => 
          fetchPairData(
            { marketSymbol }, 
            spotEx, 
            futEx, 
            spotExchangeId, 
            futuresExchangeId, 
            requestedDirection
          )
        )
      );
      results.push(...batchResults.filter(Boolean));
      
      // Pequena pausa entre lotes para evitar rate limiting
      if (i + batchSize < validPairs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const validOpportunities = results.filter(Boolean);
    validOpportunities.sort((a, b) => Math.abs(parseFloat((b as any).percentDiff)) - Math.abs(parseFloat((a as any).percentDiff)));

    const response = {
      result: {
        list: validOpportunities,
      },
      retCode: 0,
      retMsg: 'OK',
    };

    // Salvar no cache
    opportunityCache.set(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Inter-Exchange - Erro geral ao buscar oportunidades de arbitragem:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Erro ao buscar oportunidades inter-corretoras', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 