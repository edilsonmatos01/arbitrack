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
import InstantPriceComparisonChart from './InstantPriceComparisonChart';
import InstantSpread24hChart from './InstantSpread24hChart';
import { useChartCache } from '@/lib/chart-cache';

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

// Cache em memória para evitar chamadas repetidas
const cache = new Map<string, { data: SpreadStats; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

export default function MaxSpreadCell({ symbol, currentSpread = 0, maxSpread24h = null }: MaxSpreadCellProps) {
  const [stats, setStats] = useState<SpreadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartType, setChartType] = useState<'spread' | 'comparison'>('spread');
  const { isAlertEnabled, toggleAlert } = useSoundAlerts();
  const { prefetchData } = useChartCache();

  // Buscar dados do spread máximo real das últimas 24 horas
  useEffect(() => {
    const fetchStats = async () => {
      const cached = cache.get(symbol);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION_MS)) {
        setStats(cached.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log(`[MaxSpreadCell] Buscando spread máximo real para ${symbol}...`);
        const response = await fetch(`/api/spreads/${encodeURIComponent(symbol)}/max`);
        
        if (!response.ok) {
          console.warn(`[MaxSpreadCell] Erro ao buscar spread máximo para ${symbol}: ${response.status} ${response.statusText}`);
          setStats(null);
          return;
        }
        
        const data: SpreadStats = await response.json();
        console.log(`[MaxSpreadCell] Dados recebidos para ${symbol}:`, data);
        
        // Se não houver dados suficientes, mostra N/D
        if (data.spMax === null || data.crosses < 2) {
          setStats({ spMax: null, crosses: data.crosses });
        } else {
          setStats(data);
        }
        
        cache.set(symbol, { data, timestamp: Date.now() });
      } catch (error) {
        console.warn(`[MaxSpreadCell] Erro de rede ao buscar spread máximo para ${symbol}:`, error instanceof Error ? error.message : 'Erro desconhecido');
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [symbol]);

  // Reset chart type when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setChartType('spread');
    }
  }, [isModalOpen]);

  // Pré-carregar dados dos gráficos ao abrir o modal
  useEffect(() => {
    if (isModalOpen) {
      console.log(`[MaxSpreadCell] Pré-carregando dados para ${symbol}...`);
      prefetchData(symbol);
    }
  }, [isModalOpen, symbol, prefetchData]);

  const getSpreadColor = (spread: number) => {
    if (spread > 2) return 'text-green-400';
    if (spread > 1) return 'text-yellow-400';
    return 'text-gray-400';
  };

  if (isLoading) {
    return <span className="text-gray-500">Carregando...</span>;
  }

  if (!stats || stats.spMax === null || stats.crosses < 2) {
    return <span className="text-gray-400">N/D</span>;
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <div className={`text-sm font-bold ${getSpreadColor(stats.spMax)}`}>
          {stats.spMax.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-400">
          Spread máximo 24h ({stats.crosses} registros)
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <SoundAlert 
          symbol={symbol}
          currentSpread={currentSpread}
          maxSpread24h={stats.spMax}
          isEnabled={isAlertEnabled(symbol)}
          onToggle={(enabled) => toggleAlert(symbol, enabled)}
        />
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button className="p-1 text-gray-400 hover:text-white transition-colors">
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
              {chartType === 'spread' ? (
                <InstantSpread24hChart symbol={symbol} />
              ) : (
                <InstantPriceComparisonChart symbol={symbol} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
