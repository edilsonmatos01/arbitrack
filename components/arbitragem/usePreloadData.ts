import { useState, useEffect, useCallback } from 'react';

interface SpreadData {
  spMax: number;
  spMin: number;
  crosses: number;
  exchanges: string[];
}

interface ChartData {
  timestamp: string;
  spread: number;
  spotPrice: number;
  futuresPrice: number;
}

interface PreloadData {
  spreads: Record<string, SpreadData>;
  chartData: Record<string, ChartData[]>;
  lastUpdate: Date;
  isLoading: boolean;
  error: string | null;
}

// Cache global em memória
let globalCache: PreloadData | null = null;
let isLoading = false;

export function usePreloadData() {
  console.log('[PreloadData] Hook sendo inicializado...');
  
  const [data, setData] = useState<PreloadData | null>(globalCache);
  const [localLoading, setLocalLoading] = useState(!globalCache && !isLoading);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('[PreloadData] Estados iniciais:', { 
    hasGlobalCache: !!globalCache, 
    isLoading, 
    localLoading,
    hasData: !!data,
    isInitialized
  });

  const preloadAllData = useCallback(async () => {
    // Limpar cache global para forçar recarregamento
    globalCache = null;
    
    if (isLoading) return; // Evitar múltiplas requisições simultâneas
    
    try {
      isLoading = true;
      setLocalLoading(true);
      setError(null);

      console.log('[PreloadData] Iniciando pré-carregamento RÁPIDO...');
      const startTime = Date.now();

      // 1. Carregar APENAS dados de spread máximo (sem gráficos)
      console.log('[PreloadData] Fazendo requisição para /api/init-data-simple...');
      const spreadResponse = await fetch('/api/init-data-simple?user_id=edilsonmatos');
      if (!spreadResponse.ok) {
        throw new Error('Erro ao carregar dados de spread');
      }
      const spreadData = await spreadResponse.json();
      console.log('[PreloadData] Dados de spread recebidos:', spreadData);

      const endTime = Date.now();
      console.log(`[PreloadData] Pré-carregamento RÁPIDO concluído em ${endTime - startTime}ms`);

      const preloadData: PreloadData = {
        spreads: spreadData.spreads?.data || {},
        chartData: {}, // Gráficos serão carregados sob demanda
        lastUpdate: new Date(),
        isLoading: false,
        error: null
      };

      // Salvar no cache global IMEDIATAMENTE
      globalCache = preloadData;
      setData(preloadData);
      setLocalLoading(false);
      setIsInitialized(true);

      console.log(`[PreloadData] Cache atualizado RAPIDAMENTE: ${Object.keys(preloadData.spreads).length} spreads`);
      console.log('[PreloadData] Dados disponíveis IMEDIATAMENTE:', Object.keys(preloadData.spreads).slice(0, 3).map(s => ({ symbol: s, data: preloadData.spreads[s] })));

    } catch (err: any) {
      console.error('[PreloadData] Erro no pré-carregamento:', err);
      setError(err.message || 'Erro ao pré-carregar dados');
      setLocalLoading(false);
    } finally {
      isLoading = false;
    }
  }, []);

  // Carregar dados na inicialização - SEMPRE executar
  useEffect(() => {
    // Se já temos dados no cache global, usar imediatamente
    if (globalCache && !isLoading) {
      setData(globalCache);
      setLocalLoading(false);
      setIsInitialized(true);
      return;
    }
    
    // SEMPRE recarregar dados para garantir que estão atualizados
    preloadAllData();
  }, [preloadAllData, isLoading]);

  // Funções utilitárias
  const getSpreadData = useCallback((symbol: string): SpreadData | null => {
    if (!data?.spreads) {
      return null;
    }
    
    return data.spreads[symbol] || null;
  }, [data]);

  const getChartData = useCallback((symbol: string): ChartData[] => {
    if (!data?.chartData) return [];
    return data.chartData[symbol] || [];
  }, [data]);

  const refreshData = useCallback(() => {
    globalCache = null; // Limpar cache
    setIsInitialized(false);
    preloadAllData();
  }, [preloadAllData]);

  return {
    data,
    isLoading: localLoading,
    error,
    getSpreadData,
    getChartData,
    refreshData,
    preloadAllData,
    isInitialized
  };
} 