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
  arbitrageType: string; // Mudado para string genérico para aceitar 'spot-to-future'
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

export function useArbitrageWebSocket(enabled = true, maxOpportunities = 20) {
  // DEBUG: Log do maxOpportunities recebido
  console.log('[WS Hook] maxOpportunities recebido:', maxOpportunities);
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

  // Substituir a função updateOpportunities por uma versão que mantém o ranking incremental, ordena por spread decrescente e limita ao máximo configurado.
  const updateOpportunities = useCallback((newOpportunity: ArbitrageOpportunity) => {
    if (isMounted.current) {
      console.log('[WS Hook] 🔄 Atualizando oportunidades:', newOpportunity.baseSymbol, newOpportunity.profitPercentage, '%');
      console.log('[WS Hook] 📊 maxOpportunities atual:', maxOpportunities);
      
      safeSetOpportunities(prev => {
        console.log('[WS Hook] 📊 Estado anterior:', prev.length, 'oportunidades');
        
        // Remove se já existe (mesmo baseSymbol e arbitrageType)
        const filtered = prev.filter(
          p => !(p.baseSymbol === newOpportunity.baseSymbol && p.arbitrageType === newOpportunity.arbitrageType)
        );
        console.log('[WS Hook] 📊 Após filtro:', filtered.length, 'oportunidades');
        
        // Adiciona a nova oportunidade
        const updated = [...filtered, newOpportunity];
        console.log('[WS Hook] 📊 Após adicionar:', updated.length, 'oportunidades');
        
        // Ordena por spread decrescente
        updated.sort((a, b) => b.profitPercentage - a.profitPercentage);
        
        // Limita ao máximo configurado
        const result = updated.slice(0, maxOpportunities);
        console.log('[WS Hook] 📊 Após slice:', result.length, 'oportunidades (limite:', maxOpportunities, ')');
        
        // DEBUG: Log das oportunidades sendo enviadas
        console.log('[WS Hook] 📊 Oportunidades sendo enviadas para o componente:', result.length);
        if (result.length > 0) {
          console.log('[WS Hook] 📊 Top 5 oportunidades:', result.slice(0, 5).map(opp => `${opp.baseSymbol}: ${opp.profitPercentage}%`));
        }
        
        return result;
      });
    }
  }, [safeSetOpportunities, maxOpportunities]);

  // Função otimizada para atualizar preços - ATUALIZAÇÃO ULTRA-RÁPIDA
  const updateLivePrices = useCallback((symbol: string, marketType: string, bestAsk: number, bestBid: number) => {
    // Atualização IMEDIATA para TODOS os pares
    if (isMounted.current) {
      console.log(`[WS Hook] 🔄 Atualizando preços: ${symbol} ${marketType} - Ask: ${bestAsk}, Bid: ${bestBid}`);
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
    // SOLUÇÃO DEFINITIVA: Forçar URL correta baseada no hostname
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'server';
    console.log('[WS Hook] Hostname detectado:', hostname);
    
    // Se estiver em qualquer domínio onrender.com, usar o worker correto
    if (hostname.includes('onrender.com')) {
      const productionURL = 'wss://arbitrage-worker.onrender.com';
      console.log('[WS Hook] 🎯 PRODUÇÃO DETECTADA - Usando URL:', productionURL);
      return productionURL;
    }
    
    // Se estiver em localhost, usar localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const localURL = 'ws://localhost:10000';
      console.log('[WS Hook] 🏠 LOCALHOST DETECTADO - Usando URL:', localURL);
      return localURL;
    }
    
    // Fallback para qualquer outro ambiente
    const fallbackURL = 'wss://arbitrage-worker.onrender.com';
    console.log('[WS Hook] 🔄 FALLBACK - Usando URL:', fallbackURL);
    return fallbackURL;
  }, []);

  const connect = useCallback(() => {
    // Limpar timeout de reconexão se existir
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    // Não conectar se já há uma conexão ativa ou se o componente não está montado
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('[WS Hook] WebSocket já está conectado');
      return;
    }
    
    if (!isMounted.current) {
      console.log('[WS Hook] Componente não está montado, não conectando');
      return;
    }

    const wsURL = getWebSocketURL();
    
    if (!wsURL) {
      console.error('[WS Hook] URL do WebSocket não disponível');
      return;
    }

    try {
      console.log(`[WS Hook] Tentando conectar ao servidor WebSocket em ${wsURL}...`);
      ws.current = new WebSocket(wsURL);

      // Configurar timeout de conexão
      const connectionTimeout = setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.CONNECTING) {
          console.error('[WS Hook] Timeout na conexão WebSocket');
          ws.current.close();
        }
      }, 10000); // Reduzido para 10 segundos

      ws.current.onopen = () => {
        console.log('[WS Hook] ✅ Conexão WebSocket estabelecida com sucesso!');
        clearTimeout(connectionTimeout);
        
        // Enviar mensagem de identificação
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'client-connect',
            client: 'arbitrage-app',
            timestamp: Date.now()
          }));
        }
      };

      ws.current.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const message = JSON.parse(event.data);
          
          // DEBUG: Log de TODAS as mensagens recebidas
          console.log('[WS Hook] 📨 Mensagem recebida:', message);
          
          if (message.type === 'arbitrage') {
            console.log('[WS Hook] 📨 Mensagem arbitrage recebida:', message);
            
            // DEBUG: Verificar se é WHITE_USDT
            if (message.baseSymbol === 'WHITE_USDT') {
              console.log('[WS Hook] 🎯 WHITE_USDT detectada! Spread:', message.profitPercentage, '%');
            }
            
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
        console.error('[WS Hook] ❌ Erro na conexão WebSocket:', error);
        console.error('[WS Hook] Detalhes do erro:', {
          type: error.type,
          target: error.target,
          isTrusted: error.isTrusted
        });
        clearTimeout(connectionTimeout);
        
        // Não fechar a conexão automaticamente no erro
        // Deixar o onclose lidar com a reconexão
      };

      ws.current.onclose = (event) => {
        console.log('[WS Hook] 🔌 Conexão WebSocket fechada:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        
        // Limpar a referência atual
        ws.current = null;
        
        // Não reconectar se foi fechado intencionalmente
        if (event.code === 1000 || event.code === 1001) {
          console.log('[WS Hook] Conexão fechada intencionalmente, não reconectando');
          return;
        }
        
        // Reconectar apenas se o componente ainda estiver montado e enabled
        if (isMounted.current && enabled) {
          console.log('[WS Hook] Tentando reconectar em 3 segundos...');
          reconnectTimeout.current = setTimeout(() => {
            if (isMounted.current && enabled) {
              connect();
            }
          }, 3000);
        }
      };
      
    } catch (error) {
      console.error('[WS Hook] ❌ Erro ao criar conexão WebSocket:', error);
    }
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