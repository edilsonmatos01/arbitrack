import { useState, useEffect } from 'react';

interface SpreadStats {
  spMax: number | null;
  crosses: number;
}

interface ChartData {
  spreadHistory: any[];
  priceComparison: any[];
}

interface AllArbitrageData {
  maxSpreads: Record<string, SpreadStats>;
  chartData: Record<string, ChartData>;
  timestamp: string;
}

interface UseAllArbitrageDataReturn {
  data: AllArbitrageData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Cache global para evitar múltiplas requisições
let globalCache: { data: AllArbitrageData | null; timestamp: number } | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

export function useAllArbitrageData(): UseAllArbitrageDataReturn {
  const [data, setData] = useState<AllArbitrageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Verificar cache global primeiro
      if (globalCache && (Date.now() - globalCache.timestamp < CACHE_DURATION)) {
        console.log('[useAllArbitrageData] Usando dados em cache global');
        setData(globalCache.data);
        setIsLoading(false);
        return;
      }

      console.log('[useAllArbitrageData] Carregando todos os dados de arbitragem...');
      setIsLoading(true);
      setError(null);

      // Usar URL relativa para funcionar em qualquer porta
      const response = await fetch('/api/arbitrage/all-data');
      
      console.log('[useAllArbitrageData] Resposta recebida:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useAllArbitrageData] Erro na resposta:', errorText);
        throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
      }

      const result: AllArbitrageData = await response.json();
      
      console.log('[useAllArbitrageData] Dados parseados:', {
        symbols: Object.keys(result.maxSpreads).length,
        maxSpreads: Object.keys(result.maxSpreads),
        timestamp: result.timestamp,
        sampleData: Object.entries(result.maxSpreads).slice(0, 3)
      });
      
      // Salvar no cache global
      globalCache = { data: result, timestamp: Date.now() };
      
      setData(result);
      setIsLoading(false);
      
      console.log('[useAllArbitrageData] Dados carregados com sucesso:', {
        symbols: Object.keys(result.maxSpreads).length,
        timestamp: result.timestamp
      });

    } catch (err) {
      console.error('[useAllArbitrageData] Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsLoading(false);
    }
  };

  const refetch = () => {
    // Limpar cache global para forçar nova busca
    globalCache = null;
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch };
}

// Hook para acessar dados específicos de um símbolo
export function useSymbolData(symbol: string) {
  const { data, isLoading, error } = useAllArbitrageData();

  // Log de debug para cada símbolo
  console.log(`[useSymbolData] ${symbol}:`, {
    hasData: !!data,
    isLoading,
    error,
    maxSpreads: data?.maxSpreads ? Object.keys(data.maxSpreads) : []
  });

  if (!data) {
    return {
      maxSpread: null,
      crosses: 0,
      spreadHistory: [],
      priceComparison: [],
      isLoading,
      error
    };
  }

  const maxSpreadData = data.maxSpreads[symbol] || { spMax: null, crosses: 0 };
  const chartData = data.chartData[symbol] || { spreadHistory: [], priceComparison: [] };

  // Log de debug para dados específicos do símbolo
  console.log(`[useSymbolData] ${symbol} dados:`, {
    maxSpread: maxSpreadData.spMax,
    crosses: maxSpreadData.crosses,
    hasSpreadHistory: chartData.spreadHistory.length > 0,
    hasPriceComparison: chartData.priceComparison.length > 0
  });

  return {
    maxSpread: maxSpreadData.spMax,
    crosses: maxSpreadData.crosses,
    spreadHistory: chartData.spreadHistory,
    priceComparison: chartData.priceComparison,
    isLoading,
    error
  };
} 