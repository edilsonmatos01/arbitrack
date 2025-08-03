'use client';

import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
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

// Lazy loading dos componentes de gráfico para melhor performance
const InstantPriceComparisonChart = lazy(() => import('./InstantPriceComparisonChart'));
const InstantSpread24hChart = lazy(() => import('./InstantSpread24hChart'));

// Cache global para dados de gráficos
const chartCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função otimizada para prefetch de dados
function prefetchChartData(symbol: string, chartType: 'spread' | 'comparison') {
  const cacheKey = `${chartType}-${symbol}`;
  const cached = chartCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return; // Dados já estão em cache
  }

  const endpoint = chartType === 'spread' 
    ? `/api/spread-history/24h/${encodeURIComponent(symbol)}`
    : `/api/price-comparison/${encodeURIComponent(symbol)}`;

  fetch(endpoint)
    .then(res => {
      if (!res.ok) {
        console.warn(`[PREFETCH] Erro ao buscar dados para ${symbol}: ${res.status}`);
        return null;
      }
      return res.json();
    })
    .then(result => {
      if (Array.isArray(result)) {
        chartCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: CACHE_TTL
        });
      }
    })
    .catch(err => {
      console.warn(`[PREFETCH] Erro de rede para ${symbol}:`, err.message);
    });
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

// Componente de loading otimizado
const ChartLoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-cyan mx-auto mb-2"></div>
      <div className="text-gray-400">Carregando gráfico...</div>
    </div>
  </div>
);

export default function MaxSpreadCell({ symbol, currentSpread = 0, maxSpread24h = null }: MaxSpreadCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartType, setChartType] = useState<'spread' | 'comparison'>('spread');
  const [isChartLoading, setIsChartLoading] = useState(false);
  const { isAlertEnabled, toggleAlert } = useSoundAlerts();
  
  // Ref para manter o estado do modal durante re-renderizações
  const modalStateRef = useRef({ isOpen: false, chartType: 'spread' as 'spread' | 'comparison' });
  
  // Usar o novo hook otimizado
  const { data, getMaxSpread, isLoading, error } = useInitDataOptimized();
  const maxSpread = getMaxSpread(symbol);

  // Memoizar o valor do spread para evitar recálculos desnecessários
  const spreadColor = useMemo(() => {
    if (maxSpread > 2) return 'text-green-400';
    if (maxSpread > 1) return 'text-yellow-400';
    return 'text-gray-400';
  }, [maxSpread]);

  // Funções estáveis usando useCallback para evitar re-renderizações desnecessárias
  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
    modalStateRef.current.isOpen = true;
    setIsChartLoading(true);
    
    // Prefetch dos dados do gráfico quando o modal abre
    prefetchChartData(symbol, 'spread');
    prefetchChartData(symbol, 'comparison');
    
    // Carregamento instantâneo similar à outra plataforma
    setTimeout(() => {
      setIsChartLoading(false);
    }, 50);
  }, [symbol]);

  const handleChartTypeChange = useCallback((newType: 'spread' | 'comparison') => {
    setChartType(newType);
    modalStateRef.current.chartType = newType;
    
    // Prefetch do tipo de gráfico selecionado
    prefetchChartData(symbol, newType);
  }, [symbol]);

  const handleModalClose = useCallback((open: boolean) => {
    if (!open) {
      modalStateRef.current.isOpen = false;
      setIsModalOpen(false);
    } else {
      modalStateRef.current.isOpen = true;
      setIsModalOpen(true);
    }
  }, []);

  // Restaurar estado do modal após re-renderizações
  useEffect(() => {
    if (modalStateRef.current.isOpen && !isModalOpen) {
      setIsModalOpen(true);
    }
  }, [isModalOpen]);

  // Reset chart type when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setChartType('spread');
      setIsChartLoading(false);
      modalStateRef.current.chartType = 'spread';
    }
  }, [isModalOpen]);

  // Renderização condicional otimizada
  if (isLoading) {
    return <span className="text-gray-400">Carregando...</span>;
  }

  if (error) {
    return <span className="text-gray-400">Erro</span>;
  }

  // Se não há dados ou spread é 0, mostrar N/D
  if (!maxSpread || maxSpread === 0) {
    return (
      <div className="text-gray-400">
        <div>N/D</div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <div className={`text-sm font-bold ${spreadColor}`}>
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
        
        <Dialog 
          open={isModalOpen} 
          onOpenChange={handleModalClose}
          modal={true}
        >
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
                    onClick={() => handleChartTypeChange('spread')}
                  >
                    Spread 24h
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${chartType === 'comparison' ? 'bg-custom-cyan text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    onClick={() => handleChartTypeChange('comparison')}
                  >
                    Spot vs Futures
                  </button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0 mt-4">
              {isChartLoading ? (
                <ChartLoadingSpinner />
              ) : (
                <Suspense fallback={<ChartLoadingSpinner />}>
                  {chartType === 'spread' ? (
                    <InstantSpread24hChart symbol={symbol} preloadedData={[]} />
                  ) : (
                    <InstantPriceComparisonChart symbol={symbol} />
                  )}
                </Suspense>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
