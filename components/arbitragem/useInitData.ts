import { useState, useEffect } from 'react';

interface MaxSpread {
  symbol: string;
  maxSpread: number;
  count: number;
}

interface HistoricalDataPoint {
  timestamp: string;
  spread: number;
}

interface HistoricalData {
  symbol: string;
  data: HistoricalDataPoint[];
}

interface PriceComparison {
  symbol: string;
  spotPrice: number;
  futuresPrice: number;
}

interface InitData {
  timestamp: string;
  symbols: string[];
  maxSpreads: MaxSpread[];
  historicalData: HistoricalData[];
  priceComparison: PriceComparison[];
  opportunities: any[];
  dbAvailable?: boolean; // Flag para indicar se o banco está disponível
}

interface UseInitDataReturn {
  data: InitData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInitData(): UseInitDataReturn {
  console.log('[useInitData] Hook sendo inicializado');
  
  const [data, setData] = useState<InitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      console.log('[useInitData] Iniciando carregamento de dados de inicialização...');
      console.log('[useInitData] URL da API:', '/api/init-data-simple');
      setIsLoading(true);
      setError(null);

      const startTime = Date.now();
      const response = await fetch('/api/init-data-simple');
      const endTime = Date.now();
      
      console.log(`[useInitData] Resposta recebida em ${endTime - startTime}ms:`, {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('[useInitData] Dados carregados com sucesso:', {
        symbols: result.symbols?.length || 0,
        maxSpreads: result.maxSpreads?.length || 0,
        historicalData: result.historicalData?.length || 0,
        priceComparison: result.priceComparison?.length || 0
      });
      
      // Log detalhado dos spreads máximos
      if (result.maxSpreads) {
        console.log('[useInitData] Spreads máximos recebidos:', result.maxSpreads);
        console.log('[useInitData] Símbolos com spread > 0:', result.maxSpreads.filter((s: any) => s.maxSpread > 0).map((s: any) => s.symbol));
      }

      setData(result);
    } catch (err) {
      console.error('[useInitData] Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[useInitData] useEffect executado - iniciando fetchData');
    fetchData();
  }, []);

  const refetch = () => {
    console.log('[useInitData] refetch chamado');
    fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

// Hook para acessar dados de um símbolo específico
export function useSymbolData(symbol: string) {
  const { data, isLoading, error } = useInitData();

  // Normalizar símbolo para garantir correspondência
  const normalizedSymbol = symbol.includes('_') ? symbol.toUpperCase() : `${symbol.toUpperCase()}_USDT`;
  const maxSpread = data?.maxSpreads?.find(s => s.symbol.toUpperCase() === normalizedSymbol);
  const historicalData = data?.historicalData?.find(s => s.symbol.toUpperCase() === normalizedSymbol);
  const priceComparison = data?.priceComparison?.find(s => s.symbol.toUpperCase() === normalizedSymbol);

  console.log(`[useSymbolData] Buscando:`, {
    buscado: normalizedSymbol,
    disponiveis: data?.maxSpreads?.map(s => s.symbol),
    encontrado: !!maxSpread,
    valor: maxSpread?.maxSpread || 0,
    isLoading,
    error
  });

  return {
    maxSpread: maxSpread?.maxSpread || 0,
    historicalData: historicalData?.data || [],
    spotPrice: priceComparison?.spotPrice || 0,
    futuresPrice: priceComparison?.futuresPrice || 0,
    isLoading,
    error
  };
} 