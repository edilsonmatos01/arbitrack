import { useEffect, useCallback } from 'react';
import { useChartCache } from '@/lib/chart-cache';

// Lista de símbolos mais comuns para pré-carregamento
const COMMON_SYMBOLS = [
  'WHITE_USDT', 'KEKIUS_USDT', 'BTC_USDT', 'ETH_USDT', 'SOL_USDT',
  'BNB_USDT', 'XRP_USDT', 'LINK_USDT', 'AAVE_USDT', 'APT_USDT'
];

export function usePreloadCharts() {
  const { prefetchMultipleSymbols, prefetchData } = useChartCache();

  // Pré-carregar símbolos comuns quando o hook é inicializado
  useEffect(() => {
    console.log('[usePreloadCharts] Iniciando pré-carregamento de símbolos comuns...');
    prefetchMultipleSymbols(COMMON_SYMBOLS);
  }, [prefetchMultipleSymbols]);

  // Função para pré-carregar um símbolo específico
  const preloadSymbol = useCallback((symbol: string) => {
    console.log(`[usePreloadCharts] Pré-carregando símbolo específico: ${symbol}`);
    prefetchData(symbol);
  }, [prefetchData]);

  // Função para pré-carregar múltiplos símbolos
  const preloadSymbols = useCallback((symbols: string[]) => {
    console.log(`[usePreloadCharts] Pré-carregando ${symbols.length} símbolos...`);
    prefetchMultipleSymbols(symbols);
  }, [prefetchMultipleSymbols]);

  return {
    preloadSymbol,
    preloadSymbols,
    commonSymbols: COMMON_SYMBOLS
  };
}

// Hook para pré-carregar dados quando o mouse passa sobre um elemento
export function useHoverPreload(symbol: string) {
  const { prefetchData } = useChartCache();

  const handleMouseEnter = useCallback(() => {
    console.log(`[useHoverPreload] Mouse sobre ${symbol}, pré-carregando...`);
    prefetchData(symbol);
  }, [symbol, prefetchData]);

  return { handleMouseEnter };
}

// Hook para pré-carregar dados quando um elemento fica visível
export function useVisibilityPreload(symbol: string) {
  const { prefetchData } = useChartCache();

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        console.log(`[useVisibilityPreload] ${symbol} ficou visível, pré-carregando...`);
        prefetchData(symbol);
      }
    });
  }, [symbol, prefetchData]);

  const ref = useCallback((node: HTMLElement | null) => {
    if (node) {
      const observer = new IntersectionObserver(handleIntersection, {
        threshold: 0.1,
        rootMargin: '50px'
      });
      observer.observe(node);
      
      return () => observer.disconnect();
    }
  }, [handleIntersection]);

  return { ref };
} 