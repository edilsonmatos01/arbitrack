import { useEffect, useState, useRef, useCallback } from 'react';

// Idealmente, esta interface ArbitrageOpportunity seria importada de um local compartilhado
// entre o backend (websocket-server.ts) e o frontend.
interface ArbitrageOpportunity {
  type: 'arbitrage'; // Assegura que estamos lidando com a mensagem correta
  baseSymbol: string; 
  profitPercentage: number;
  buyAt: {
    exchange: string;
    price: number;
    marketType: 'spot' | 'futures';
    fundingRate?: string;
    originalSymbol?: string; 
  };
  sellAt: {
    exchange: string;
    price: number;
    marketType: 'spot' | 'futures';
    fundingRate?: string;
    originalSymbol?: string; 
  };
  arbitrageType: string; // Mudado para string genérico para aceitar 'spot_to_futures'
  timestamp: number;
  maxSpread24h?: number;
}

interface LivePrices {
    [symbol: string]: {
        [marketType: string]: {
            bestAsk: number;
            bestBid: number;
        }
    }
}

// Classe para debouncing de atualizações
class Debouncer {
  private timeoutId: NodeJS.Timeout | null = null;
  private delay: number;

  constructor(delay: number = 100) {
    this.delay = delay;
  }

  debounce(func: () => void) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(func, this.delay);
  }

  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Classe para throttling de mensagens
class Throttler {
  private lastCall = 0;
  private delay: number;

  constructor(delay: number = 50) {
    this.delay = delay;
  }

  throttle(func: () => void) {
    const now = Date.now();
    if (now - this.lastCall >= this.delay) {
      func();
      this.lastCall = now;
    }
  }
}

export function useArbitrageWebSocket(enabled = true) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [livePrices, setLivePrices] = useState<LivePrices>({});
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);
  
  // Otimizações de performance - ULTRA-RÁPIDAS
  const debouncer = useRef(new Debouncer(20)); // Reduzido para 20ms
  const throttler = useRef(new Throttler(5)); // Reduzido para 5ms
  const opportunitiesBuffer = useRef<ArbitrageOpportunity[]>([]);
  const pricesBuffer = useRef<LivePrices>({});

  // Função para garantir que opportunities seja sempre um array válido
  const safeSetOpportunities = useCallback((newOpportunities: ArbitrageOpportunity[] | ((prev: ArbitrageOpportunity[]) => ArbitrageOpportunity[])) => {
    try {
      if (typeof newOpportunities === 'function') {
        setOpportunities(prev => {
          const result = newOpportunities(prev);
          return Array.isArray(result) ? result : [];
        });
      } else {
        setOpportunities(Array.isArray(newOpportunities) ? newOpportunities : []);
      }
    } catch (error) {
      console.error('[WS Hook] Erro ao atualizar opportunities:', error);
      setOpportunities([]);
    }
  }, []);

  // Função otimizada para atualizar oportunidades - ATUALIZAÇÃO ULTRA-RÁPIDA
  const updateOpportunities = useCallback((newOpportunity: ArbitrageOpportunity) => {
    // Atualização IMEDIATA para TODAS as oportunidades
    if (isMounted.current) {
      safeSetOpportunities(prev => {
        const filtered = prev.filter(p => 
          p.baseSymbol !== newOpportunity.baseSymbol || 
          p.arbitrageType !== newOpportunity.arbitrageType
        );
        return [newOpportunity, ...filtered].slice(0, 15); // Reduzido para 15
      });
    }
  }, [safeSetOpportunities]);

  // Função otimizada para atualizar preços - ATUALIZAÇÃO ULTRA-RÁPIDA
  const updateLivePrices = useCallback((symbol: string, marketType: string, bestAsk: number, bestBid: number) => {
    // Atualização IMEDIATA para TODOS os pares
    if (isMounted.current) {
      setLivePrices(prev => ({
        ...prev,
        [symbol]: {
          ...prev[symbol],
          [marketType]: { bestAsk, bestBid }
        }
      }));
    }
  }, []);

  const getWebSocketURL = useCallback(() => {
    const wsURL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

    console.log('[WS Hook] Variável de ambiente NEXT_PUBLIC_WEBSOCKET_URL:', wsURL);
    console.log('[WS Hook] NODE_ENV:', process.env.NODE_ENV);

    if (!wsURL) {
      console.error("A variável de ambiente NEXT_PUBLIC_WEBSOCKET_URL não está definida!");
      if (process.env.NODE_ENV === 'development') {
        if (typeof window === 'undefined') return '';
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const fallbackURL = `${protocol}//${host}:10000`;
        console.log('[WS Hook] Usando URL de fallback para desenvolvimento:', fallbackURL);
        return fallbackURL;
      }
      return '';
    }

    console.log('[WS Hook] Usando URL da variável de ambiente:', wsURL);
    return wsURL;
  }, []);

  const connect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current || !isMounted.current) return;

    const wsURL = getWebSocketURL();
    if (!wsURL) return;

    ws.current = new WebSocket(wsURL);
    console.log(`[WS Hook] Tentando conectar ao servidor WebSocket em ${wsURL}...`);

    ws.current.onopen = () => {
      console.log('[WS Hook] Conexão WebSocket estabelecida.');
    };

    ws.current.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'arbitrage') {
          updateOpportunities(message);
        }
        else if (message.type === 'opportunity') {
          console.log('[WS Hook] 📨 Mensagem opportunity recebida:', message);
          
          // CORREÇÃO FINAL: Mapear preços corretamente baseado na lógica de arbitragem
          // Compra sempre no SPOT (preço mais baixo), Venda sempre no FUTURES (preço mais alto)
          const buyPrice = message.spotPrice; // Sempre compra no spot
          const sellPrice = message.futuresPrice; // Sempre venda no futures
          const buyMarketType = 'spot'; // Compra sempre no spot
          const sellMarketType = 'futures'; // Venda sempre no futures
          
          // Converter mensagem do novo formato para o formato esperado
          const arbitrageMessage: ArbitrageOpportunity = {
            type: 'arbitrage',
            baseSymbol: message.symbol,
            profitPercentage: message.spread,
            buyAt: {
              exchange: message.exchangeBuy,
              price: buyPrice,
              marketType: buyMarketType
            },
            sellAt: {
              exchange: message.exchangeSell,
              price: sellPrice,
              marketType: sellMarketType
            },
            arbitrageType: message.direction,
            timestamp: new Date(message.timestamp).getTime()
          };
          
          console.log('[WS Hook] ✅ Oportunidade convertida:', arbitrageMessage);
          updateOpportunities(arbitrageMessage);
        }
        else if (message.type === 'price-update') {
          const { symbol, marketType, bestAsk, bestBid } = message;
          updateLivePrices(symbol, marketType, bestAsk, bestBid);
        }
        else if (message.type === 'connection') {
          console.log('[WS Hook] ✅ Conectado ao servidor:', message.message);
        }
        else if (message.type === 'heartbeat') {
          console.log('[WS Hook] 💓 Heartbeat recebido:', message.message);
        }
        else {
          console.log('[DEBUG] ⚠️ Tipo de mensagem não reconhecido:', message.type);
        }
      } catch (error) {
        console.error('[WS Hook] Erro ao processar mensagem do WebSocket:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('[WS Hook] Erro na conexão WebSocket:', error);
    };

    ws.current.onclose = () => {
      console.log('[WS Hook] Conexão WebSocket fechada.');
      if (isMounted.current) {
        console.log('[WS Hook] Tentando reconectar em 5 segundos...');
        ws.current = null;
        reconnectTimeout.current = setTimeout(connect, 5000);
      }
    };
  }, [getWebSocketURL, updateOpportunities, updateLivePrices]);

  useEffect(() => {
    isMounted.current = true;
    if (enabled) {
      connect();
    }
    
    return () => {
      isMounted.current = false;
      debouncer.current.cancel();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
        console.log('[WS Hook] Limpeza da conexão WebSocket concluída.');
      }
    };
  }, [enabled, connect]);

  return { 
    opportunities: Array.isArray(opportunities) ? opportunities : [], 
    livePrices: livePrices || {} 
  };
} 