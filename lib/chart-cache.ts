// Sistema de cache global otimizado para gráficos
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface ChartData {
  timestamp: string;
  spread_percentage: number;
}

interface PriceComparisonData {
  timestamp: string;
  spot: number;
  futures: number;
}

class ChartCache {
  private static instance: ChartCache;
  private spreadCache = new Map<string, CacheEntry<ChartData[]>>();
  private priceComparisonCache = new Map<string, CacheEntry<PriceComparisonData[]>>();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minuto
  private readonly MAX_CACHE_SIZE = 100; // Máximo de 100 entradas por tipo

  private constructor() {
    // Limpar cache expirado a cada 30 segundos
    setInterval(() => this.cleanupExpiredCache(), 30000);
  }

  static getInstance(): ChartCache {
    if (!ChartCache.instance) {
      ChartCache.instance = new ChartCache();
    }
    return ChartCache.instance;
  }

  // Cache para dados de spread 24h
  setSpreadData(symbol: string, data: ChartData[]): void {
    this.setCacheEntry(this.spreadCache, symbol, data);
  }

  getSpreadData(symbol: string): ChartData[] | null {
    return this.getCacheEntry(this.spreadCache, symbol);
  }

  // Cache para dados de comparação de preços
  setPriceComparisonData(symbol: string, data: PriceComparisonData[]): void {
    this.setCacheEntry(this.priceComparisonCache, symbol, data);
  }

  getPriceComparisonData(symbol: string): PriceComparisonData[] | null {
    return this.getCacheEntry(this.priceComparisonCache, symbol);
  }

  // Pré-carregar dados para um símbolo
  async prefetchData(symbol: string): Promise<void> {
    try {
      console.log(`[ChartCache] Pré-carregando dados para ${symbol}...`);
      
      // Carregar dados de spread em paralelo
      const spreadPromise = this.fetchSpreadData(symbol);
      const priceComparisonPromise = this.fetchPriceComparisonData(symbol);
      
      await Promise.all([spreadPromise, priceComparisonPromise]);
      
      console.log(`[ChartCache] Dados pré-carregados para ${symbol}`);
    } catch (error) {
      console.warn(`[ChartCache] Erro ao pré-carregar dados para ${symbol}:`, error);
    }
  }

  // Pré-carregar dados para múltiplos símbolos com limite de concorrência
  async prefetchMultipleSymbols(symbols: string[]): Promise<void> {
    console.log(`[ChartCache] Pré-carregando dados para ${symbols.length} símbolos...`);
    
    // Limitar a 3 requisições simultâneas para evitar sobrecarga
    const CONCURRENCY_LIMIT = 3;
    const chunks = [];
    
    for (let i = 0; i < symbols.length; i += CONCURRENCY_LIMIT) {
      chunks.push(symbols.slice(i, i + CONCURRENCY_LIMIT));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map((symbol: string) => this.prefetchData(symbol));
      await Promise.allSettled(promises);
      // Pequena pausa entre chunks para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`[ChartCache] Pré-carregamento concluído`);
  }

  // Buscar dados de spread com cache
  async fetchSpreadData(symbol: string): Promise<ChartData[]> {
    const cached = this.getSpreadData(symbol);
    if (cached) {
      console.log(`[ChartCache] Usando cache para spread ${symbol}`);
      return cached;
    }

    try {
      const response = await fetch(`/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Verificar se data é um array
      if (!Array.isArray(data)) {
        console.error(`[ChartCache] Dados inválidos para ${symbol}:`, data);
        return [];
      }
      
      this.setSpreadData(symbol, data);
      return data;
    } catch (error) {
      console.error(`[ChartCache] Erro ao buscar dados de spread para ${symbol}:`, error);
      return [];
    }
  }

  // Buscar dados de comparação de preços com cache
  async fetchPriceComparisonData(symbol: string): Promise<PriceComparisonData[]> {
    const cached = this.getPriceComparisonData(symbol);
    if (cached) {
      console.log(`[ChartCache] Usando cache para price comparison ${symbol}`);
      return cached;
    }

    try {
      const response = await fetch(`/api/price-comparison/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const rawData = await response.json();
      
      // Verificar se rawData é um array
      if (!Array.isArray(rawData)) {
        console.error(`[ChartCache] Dados inválidos para ${symbol}:`, rawData);
        return [];
      }
      
      // Transformar dados da API para o formato esperado pelo componente
      const transformedData: PriceComparisonData[] = rawData.map((item: any) => ({
        timestamp: item.timestamp,
        spot: item.gateio_price || null,
        futures: item.mexc_price || null
      }));
      
      this.setPriceComparisonData(symbol, transformedData);
      return transformedData;
    } catch (error) {
      console.error(`[ChartCache] Erro ao buscar dados de price comparison para ${symbol}:`, error);
      return [];
    }
  }

  // Limpar cache específico
  clearCache(symbol?: string): void {
    if (symbol) {
      this.spreadCache.delete(symbol);
      this.priceComparisonCache.delete(symbol);
      console.log(`[ChartCache] Cache limpo para ${symbol}`);
    } else {
      this.spreadCache.clear();
      this.priceComparisonCache.clear();
      console.log(`[ChartCache] Cache global limpo`);
    }
  }

  // Obter estatísticas do cache
  getCacheStats(): { spread: number; priceComparison: number } {
    return {
      spread: this.spreadCache.size,
      priceComparison: this.priceComparisonCache.size
    };
  }

  private setCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
    const expiresAt = Date.now() + this.CACHE_DURATION;
    cache.set(key, { data, timestamp: Date.now(), expiresAt });
    
    // Limitar tamanho do cache
    if (cache.size > this.MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
  }

  private getCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    // Limpar cache de spread expirado
    for (const [key, entry] of this.spreadCache.entries()) {
      if (now > entry.expiresAt) {
        this.spreadCache.delete(key);
      }
    }
    
    // Limpar cache de price comparison expirado
    for (const [key, entry] of this.priceComparisonCache.entries()) {
      if (now > entry.expiresAt) {
        this.priceComparisonCache.delete(key);
      }
    }
  }
}

// Exportar instância singleton
export const chartCache = ChartCache.getInstance();

// Hook para usar o cache em componentes React
export function useChartCache() {
  return {
    prefetchData: (symbol: string) => chartCache.prefetchData(symbol),
    prefetchMultipleSymbols: (symbols: string[]) => chartCache.prefetchMultipleSymbols(symbols),
    fetchSpreadData: (symbol: string) => chartCache.fetchSpreadData(symbol),
    fetchPriceComparisonData: (symbol: string) => chartCache.fetchPriceComparisonData(symbol),
    clearCache: (symbol?: string) => chartCache.clearCache(symbol),
    getCacheStats: () => chartCache.getCacheStats()
  };
} 