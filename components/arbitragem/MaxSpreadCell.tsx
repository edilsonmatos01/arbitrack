'use client';

import { useState, useEffect } from 'react';
import { LineChart as ChartIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import SoundAlert from './SoundAlert';
import { useSoundAlerts } from './useSoundAlerts';
import { useInitDataOptimized } from './useInitDataOptimized';
import InstantPriceComparisonChart from './InstantPriceComparisonChart';
import InstantSpread24hChart from './InstantSpread24hChart';
// import { useChartCache } from '@/lib/chart-cache';

// Funções de prefetch dos gráficos
function prefetchSpread24h(symbol: string) {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.Spread24hChart_localCache) {
    const cache = window.Spread24hChart_localCache;
    const CACHE_DURATION = 5 * 60 * 1000;
    const cached = cache.get(symbol);
    if (!cached || (Date.now() - cached.timestamp) >= CACHE_DURATION) {
      fetch(`/api/spread-history/24h/${encodeURIComponent(symbol)}`)
        .then(res => {
          if (!res.ok) {
            console.warn(`[PREFETCH] Erro ao buscar spread-history para ${symbol}: ${res.status}`);
            return null;
          }
          return res.json();
        })
        .then(result => {
          if (Array.isArray(result)) {
            cache.set(symbol, { data: result, timestamp: Date.now() });
          }
        })
        .catch(err => {
          console.warn(`[PREFETCH] Erro de rede ao buscar spread-history para ${symbol}:`, err.message);
        });
    }
  }
}

function prefetchPriceComparison(symbol: string) {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.PriceComparisonChart_localCache) {
    const cache = window.PriceComparisonChart_localCache;
    const CACHE_DURATION = 5 * 60 * 1000;
    const cached = cache.get(symbol);
    if (!cached || (Date.now() - cached.timestamp) >= CACHE_DURATION) {
      fetch(`/api/price-comparison/${encodeURIComponent(symbol)}`)
        .then(res => {
          if (!res.ok) {
            console.warn(`[PREFETCH] Erro ao buscar price-comparison para ${symbol}: ${res.status}`);
            return null;
          }
          return res.json();
        })
        .then(result => {
          if (Array.isArray(result)) {
            cache.set(symbol, { data: result, timestamp: Date.now() });
          }
        })
        .catch(err => {
          console.warn(`[PREFETCH] Erro de rede ao buscar price-comparison para ${symbol}:`, err.message);
        });
    }
  }
}

interface MaxSpreadCellProps {
  symbol: string;
  currentSpread?: number;
  maxSpread24h?: number | null;
}

interface SpreadStats {
  spMax: number | null;
  crosses: number;
}

export default function MaxSpreadCell({ symbol, currentSpread = 0, maxSpread24h = null }: MaxSpreadCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartType, setChartType] = useState<'spread' | 'comparison'>('spread');
  const [isChartLoading, setIsChartLoading] = useState(false);
  const { isAlertEnabled, toggleAlert } = useSoundAlerts();
  
  console.log(`[MaxSpreadCell] Renderizando componente para ${symbol}`);
  
  // Usar o novo hook otimizado
  const { data, getMaxSpread, isLoading, error } = useInitDataOptimized();
  const maxSpread = getMaxSpread(symbol);

  console.log(`[MaxSpreadCell] ${symbol}:`, {
    isLoading,
    maxSpread,
    hasData: maxSpread > 0,
    error,
    symbol,
    currentSpread,
    maxSpread24h,
    hasInitData: !!data,
    initDataSpreads: Object.keys(data?.spreads?.data || {}).length
  });

  // Reset chart type when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setChartType('spread');
      setIsChartLoading(false);
    }
  }, [isModalOpen]);

  // Pré-carregar dados quando modal abrir - otimizado para carregamento rápido
  const handleModalOpen = () => {
    setIsModalOpen(true);
    setIsChartLoading(true);
    
    // Carregamento instantâneo similar à outra plataforma
    setTimeout(() => {
      setIsChartLoading(false);
    }, 50); // Reduzido de 100ms para 50ms
  };

  const getSpreadColor = (spread: number) => {
    if (spread > 2) return 'text-green-400';
    if (spread > 1) return 'text-yellow-400';
    return 'text-gray-400';
  };

  // Renderização simplificada para teste
  if (isLoading) {
    return <span className="text-gray-500">Carregando...</span>;
  }

  if (error) {
    return <span className="text-red-400">Erro: {error}</span>;
  }

  if (maxSpread === 0) {
    console.log(`[MaxSpreadCell] Mostrando N/D para ${symbol} - maxSpread: ${maxSpread}`);
    return (
      <div className="text-gray-400">
        <div>N/D</div>
        <div className="text-xs">Debug: {maxSpread}</div>
        <div className="text-xs">Buscado: {symbol.replace(/[-/]/g, '_').toUpperCase()}</div>
        <div className="text-xs">Disponíveis: {Object.keys(data?.spreads?.data || {}).join(', ') || 'Nenhum'}</div>
        <div className="text-xs">InitData: {data ? 'Carregado' : 'Não carregado'}</div>
      </div>
    );
  }

  console.log(`[MaxSpreadCell] Exibindo valor para ${symbol}: ${maxSpread}%`);
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <div className={`text-sm font-bold ${getSpreadColor(maxSpread)}`}>
          {maxSpread.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-400">
          Spread máximo 24h
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <SoundAlert 
          symbol={symbol}
          currentSpread={currentSpread}
          maxSpread24h={maxSpread}
          isEnabled={isAlertEnabled(symbol)}
          onToggle={(enabled) => toggleAlert(symbol, enabled)}
        />
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button 
              onClick={handleModalOpen}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <ChartIcon className="h-5 w-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl w-[90vw] h-[80vh] bg-dark-card border-gray-700 text-white">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Análise de {symbol}</DialogTitle>
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${chartType === 'spread' ? 'bg-custom-cyan text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    onClick={() => setChartType('spread')}
                  >
                    Spread 24h
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${chartType === 'comparison' ? 'bg-custom-cyan text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    onClick={() => setChartType('comparison')}
                  >
                    Spot vs Futures
                  </button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0 mt-4">
              {isChartLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-cyan mx-auto mb-2"></div>
                    <div className="text-gray-400">Carregando gráfico...</div>
                  </div>
                </div>
              ) : (
                <>
                  {chartType === 'spread' ? (
                    <InstantSpread24hChart symbol={symbol} />
                  ) : (
                    <InstantPriceComparisonChart symbol={symbol} />
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
