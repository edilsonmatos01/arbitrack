'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
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
import { usePreloadData } from './usePreloadData';

// Lazy loading dos componentes de gráfico para melhor performance
const InstantPriceComparisonChart = lazy(() => import('./InstantPriceComparisonChart'));
const InstantSpread24hChart = lazy(() => import('./InstantSpread24hChart'));

interface ChartData {
  timestamp: string;
  spread_percentage: number; // Estrutura correta da API
}

interface InstantMaxSpreadCellProps {
  symbol: string;
  currentSpread?: number;
}

// Componente de loading otimizado
function ChartLoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-400">
        <ChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
        <p>Carregando dados do gráfico...</p>
      </div>
    </div>
  );
}

export default function InstantMaxSpreadCell({ symbol, currentSpread = 0 }: InstantMaxSpreadCellProps) {
  console.log(`[InstantMaxSpreadCell] Componente renderizado para ${symbol}`);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartType, setChartType] = useState<'spread' | 'comparison'>('spread');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const { getSpreadData, getChartData, isLoading, isInitialized } = usePreloadData();
  const { isAlertEnabled, toggleAlert } = useSoundAlerts();
  
  // Obter dados do cache pré-carregado
  const spreadData = getSpreadData(symbol);
  
  // Carregar dados de gráfico sob demanda
  const loadChartData = useCallback(async () => {
    if (chartData.length > 0) return; // Já carregado
    
    setIsChartLoading(true);
    try {
      console.log(`[InstantMaxSpreadCell] Carregando dados de gráfico para ${symbol}...`);
      const response = await fetch(`/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
        console.log(`[InstantMaxSpreadCell] Dados de gráfico carregados para ${symbol}:`, data.length, 'pontos');
      } else {
        console.warn(`[InstantMaxSpreadCell] Erro ao carregar dados para ${symbol}:`, response.status);
        setChartData([]);
      }
    } catch (err) {
      console.error(`[InstantMaxSpreadCell] Erro ao carregar dados para ${symbol}:`, err);
      setChartData([]);
    } finally {
      setIsChartLoading(false);
    }
  }, [symbol, chartData.length]);
  
  // Carregar dados quando modal abrir
  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
    loadChartData();
  }, [loadChartData]);

  const handleChartTypeChange = useCallback((newType: 'spread' | 'comparison') => {
    setChartType(newType);
  }, []);

  const handleModalClose = useCallback((open: boolean) => {
    setIsModalOpen(open);
  }, []);
  
  // Calcular cor baseada no spread máximo
  const getSpreadColor = useCallback((maxSpread: number) => {
    if (maxSpread > 2) return 'text-green-400';
    if (maxSpread > 1) return 'text-yellow-400';
    return 'text-gray-400';
  }, []);

  // Renderização condicional
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-400">
            <div className="animate-pulse bg-gray-600 h-4 w-12 rounded"></div>
          </div>
          <div className="text-xs text-gray-400">
            {isLoading ? 'Carregando...' : 'Inicializando...'}
          </div>
        </div>
        
        {/* Ícone sempre visível */}
        <div className="flex items-center space-x-1">
          <Dialog 
            open={isModalOpen} 
            onOpenChange={handleModalClose}
            modal={true}
          >
            <DialogTrigger asChild>
              <button 
                onClick={handleModalOpen}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Ver gráfico de spread 24h"
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
                <ChartLoadingSpinner />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  if (!spreadData || spreadData.spMax === null || spreadData.spMax === undefined || spreadData.crosses < 2) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-400">
            N/D
          </div>
          <div className="text-xs text-gray-400">
            {!spreadData ? 'Sem dados' : `${spreadData.crosses} registros`}
          </div>
        </div>
      </div>
    );
  }

  const spreadColor = getSpreadColor(spreadData.spMax);

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <div className={`text-sm font-bold ${spreadColor}`}>
          {spreadData.spMax.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-400">
          Spread máximo 24h
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <SoundAlert 
          symbol={symbol}
          currentSpread={currentSpread}
          maxSpread24h={spreadData.spMax}
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
              title="Ver gráfico de análise"
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
                    chartData.length > 0 ? (
                      <InstantSpread24hChart 
                        symbol={symbol} 
                        preloadedData={chartData}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-400">
                          <ChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Dados de gráfico não disponíveis</p>
                          <button 
                            onClick={loadChartData}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Tentar novamente
                          </button>
                        </div>
                      </div>
                    )
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