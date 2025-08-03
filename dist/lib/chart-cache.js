"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartCache = void 0;
exports.useChartCache = useChartCache;
class ChartCache {
    constructor() {
        this.spreadCache = new Map();
        this.priceComparisonCache = new Map();
        this.CACHE_DURATION = 60 * 1000;
        this.MAX_CACHE_SIZE = 100;
        setInterval(() => this.cleanupExpiredCache(), 30000);
    }
    static getInstance() {
        if (!ChartCache.instance) {
            ChartCache.instance = new ChartCache();
        }
        return ChartCache.instance;
    }
    setSpreadData(symbol, data) {
        this.setCacheEntry(this.spreadCache, symbol, data);
    }
    getSpreadData(symbol) {
        return this.getCacheEntry(this.spreadCache, symbol);
    }
    setPriceComparisonData(symbol, data) {
        this.setCacheEntry(this.priceComparisonCache, symbol, data);
    }
    getPriceComparisonData(symbol) {
        return this.getCacheEntry(this.priceComparisonCache, symbol);
    }
    async prefetchData(symbol) {
        try {
            console.log(`[ChartCache] Pré-carregando dados para ${symbol}...`);
            const spreadPromise = this.fetchSpreadData(symbol);
            const priceComparisonPromise = this.fetchPriceComparisonData(symbol);
            await Promise.all([spreadPromise, priceComparisonPromise]);
            console.log(`[ChartCache] Dados pré-carregados para ${symbol}`);
        }
        catch (error) {
            console.warn(`[ChartCache] Erro ao pré-carregar dados para ${symbol}:`, error);
        }
    }
    async prefetchMultipleSymbols(symbols) {
        console.log(`[ChartCache] Pré-carregando dados para ${symbols.length} símbolos...`);
        const CONCURRENCY_LIMIT = 3;
        const chunks = [];
        for (let i = 0; i < symbols.length; i += CONCURRENCY_LIMIT) {
            chunks.push(symbols.slice(i, i + CONCURRENCY_LIMIT));
        }
        for (const chunk of chunks) {
            const promises = chunk.map((symbol) => this.prefetchData(symbol));
            await Promise.allSettled(promises);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log(`[ChartCache] Pré-carregamento concluído`);
    }
    async fetchSpreadData(symbol) {
        const cached = this.getSpreadData(symbol);
        if (cached) {
            console.log(`[ChartCache] Usando cache para spread ${symbol}`);
            return cached;
        }
        try {
            const response = await fetch(`/api/spread-history/24h/${encodeURIComponent(symbol)}`);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error(`[ChartCache] Dados inválidos para ${symbol}:`, data);
                return [];
            }
            this.setSpreadData(symbol, data);
            return data;
        }
        catch (error) {
            console.error(`[ChartCache] Erro ao buscar dados de spread para ${symbol}:`, error);
            return [];
        }
    }
    async fetchPriceComparisonData(symbol) {
        const cached = this.getPriceComparisonData(symbol);
        if (cached) {
            console.log(`[ChartCache] Usando cache para price comparison ${symbol}`);
            return cached;
        }
        try {
            const response = await fetch(`/api/price-comparison/${encodeURIComponent(symbol)}`);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const rawData = await response.json();
            if (!Array.isArray(rawData)) {
                console.error(`[ChartCache] Dados inválidos para ${symbol}:`, rawData);
                return [];
            }
            const transformedData = rawData.map((item) => ({
                timestamp: item.timestamp,
                spot: item.gateio_price || null,
                futures: item.mexc_price || null
            }));
            this.setPriceComparisonData(symbol, transformedData);
            return transformedData;
        }
        catch (error) {
            console.error(`[ChartCache] Erro ao buscar dados de price comparison para ${symbol}:`, error);
            return [];
        }
    }
    clearCache(symbol) {
        if (symbol) {
            this.spreadCache.delete(symbol);
            this.priceComparisonCache.delete(symbol);
            console.log(`[ChartCache] Cache limpo para ${symbol}`);
        }
        else {
            this.spreadCache.clear();
            this.priceComparisonCache.clear();
            console.log(`[ChartCache] Cache global limpo`);
        }
    }
    getCacheStats() {
        return {
            spread: this.spreadCache.size,
            priceComparison: this.priceComparisonCache.size
        };
    }
    setCacheEntry(cache, key, data) {
        const expiresAt = Date.now() + this.CACHE_DURATION;
        cache.set(key, { data, timestamp: Date.now(), expiresAt });
        if (cache.size > this.MAX_CACHE_SIZE) {
            const firstKey = cache.keys().next().value;
            if (firstKey) {
                cache.delete(firstKey);
            }
        }
    }
    getCacheEntry(cache, key) {
        const entry = cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    }
    cleanupExpiredCache() {
        const now = Date.now();
        for (const [key, entry] of this.spreadCache.entries()) {
            if (now > entry.expiresAt) {
                this.spreadCache.delete(key);
            }
        }
        for (const [key, entry] of this.priceComparisonCache.entries()) {
            if (now > entry.expiresAt) {
                this.priceComparisonCache.delete(key);
            }
        }
    }
}
exports.chartCache = ChartCache.getInstance();
function useChartCache() {
    return {
        prefetchData: (symbol) => exports.chartCache.prefetchData(symbol),
        prefetchMultipleSymbols: (symbols) => exports.chartCache.prefetchMultipleSymbols(symbols),
        fetchSpreadData: (symbol) => exports.chartCache.fetchSpreadData(symbol),
        fetchPriceComparisonData: (symbol) => exports.chartCache.fetchPriceComparisonData(symbol),
        clearCache: (symbol) => exports.chartCache.clearCache(symbol),
        getCacheStats: () => exports.chartCache.getCacheStats()
    };
}
//# sourceMappingURL=chart-cache.js.map