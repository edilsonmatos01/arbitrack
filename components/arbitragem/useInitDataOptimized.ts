import { useState, useEffect } from 'react';

interface Position {
  _id: string;
  userId: string;
  asset: string;
  market: string;
  side: string;
  exchange: string;
  amount: number;
  entryPrice: number;
  entryAt: string;
  exitPrice: number;
  exitAt: string;
  status: string;
  pnl: number;
  linkedTo: string | null;
  group: string;
  notes: string;
  finalizedTogether: boolean;
}

interface SpreadData {
  spMax: number;
  spMin: number;
  crosses: number;
  exchanges: string[];
}

interface InitData {
  positions: {
    open: Position[];
    closed: Position[];
  };
  spreads: {
    data: Record<string, SpreadData>;
  };
  pairs: {
    gateio: string[];
    mexc: string[];
    bitget: string[];
  };
}

export function useInitDataOptimized(userId: string = 'edilsonmatos') {
  const [data, setData] = useState<InitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[useInitDataOptimized] Carregando dados...');
      const startTime = Date.now();
      
      const response = await fetch(`/api/init-data-simple?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const endTime = Date.now();
      console.log(`[useInitDataOptimized] Tempo de resposta: ${endTime - startTime}ms`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setData(result);
      setLastUpdate(new Date());
      
      console.log('[useInitDataOptimized] Dados carregados:', {
        positions: result.positions?.closed?.length || 0,
        spreads: Object.keys(result.spreads?.data || {}).length,
        pairs: Object.keys(result.pairs || {}).length
      });

    } catch (err: any) {
      console.error('[useInitDataOptimized] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, [userId]);

  // Atualizar dados a cada 5 minutos (reduzido para melhor performance)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchData();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [isLoading, userId]);

  // Funções utilitárias
  const getMaxSpread = (symbol: string): number => {
    if (!data?.spreads?.data) return 0;
    const symbolKey = symbol.includes('_') ? symbol : `${symbol}_USDT`;
    return data.spreads.data[symbolKey]?.spMax || 0;
  };

  const getPositionById = (id: string): Position | null => {
    if (!data?.positions) return null;
    
    const open = data.positions.open.find(p => p._id === id);
    if (open) return open;
    
    const closed = data.positions.closed.find(p => p._id === id);
    return closed || null;
  };

  const getPositionsBySymbol = (symbol: string): Position[] => {
    if (!data?.positions) return [];
    
    const asset = symbol.replace('/', '_');
    return [
      ...data.positions.open.filter(p => p.asset === asset),
      ...data.positions.closed.filter(p => p.asset === asset)
    ];
  };

  const getTotalPnL = (): number => {
    if (!data?.positions?.closed) return 0;
    return data.positions.closed.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  };

  const getOpenPositionsCount = (): number => {
    return data?.positions?.open?.length || 0;
  };

  const getClosedPositionsCount = (): number => {
    return data?.positions?.closed?.length || 0;
  };

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchData,
    // Funções utilitárias
    getMaxSpread,
    getPositionById,
    getPositionsBySymbol,
    getTotalPnL,
    getOpenPositionsCount,
    getClosedPositionsCount
  };
} 