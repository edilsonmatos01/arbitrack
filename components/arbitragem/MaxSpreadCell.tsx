'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
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

// Lazy loading dos gráficos para melhor performance
const SpreadHistoryChart = lazy(() => import('./SpreadHistoryChart'));
const PriceComparisonChart = lazy(() => import('./PriceComparisonChart'));

interface MaxSpreadCellProps {
  symbol: string;
  currentSpread?: number;
}

export default function MaxSpreadCell({ symbol, currentSpread = 0 }: MaxSpreadCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartType, setChartType] = useState<'spread' | 'comparison'>('spread');
  const [isLoading, setIsLoading] = useState(false);
  const { isAlertEnabled, toggleAlert } = useSoundAlerts();

  const handleModalOpen = (open: boolean) => {
    setIsModalOpen(open);
    if (open) {
      setIsLoading(true);
      // Simular um pequeno delay para mostrar loading
      setTimeout(() => setIsLoading(false), 100);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">
          {currentSpread > 0 ? `${currentSpread.toFixed(2)}%` : '0.00%'}
        </div>
        <div className="text-xs text-gray-400">
          Spread atual
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <SoundAlert 
          symbol={symbol}
          currentSpread={currentSpread}
          maxSpread24h={currentSpread > 0 ? currentSpread * 1.5 : null} // Estimativa
          isEnabled={isAlertEnabled(symbol)}
          onToggle={(enabled) => toggleAlert(symbol, enabled)}
        />
        
        <Dialog open={isModalOpen} onOpenChange={handleModalOpen}>
          <DialogTrigger asChild>
            <button className="p-1 text-gray-400 hover:text-white transition-colors">
              <ChartIcon className="h-5 w-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl bg-dark-card border-gray-700 text-white">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Análise de {symbol}</DialogTitle>
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setChartType('spread')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      chartType === 'spread'
                        ? 'bg-custom-cyan text-black font-semibold'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Spread 24h
                  </button>
                  <button
                    onClick={() => setChartType('comparison')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      chartType === 'comparison'
                        ? 'bg-custom-cyan text-black font-semibold'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Spot vs Futures
                  </button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="mt-4">
              {/* Renderiza o gráfico apenas se o modal estiver aberto */}
              {isModalOpen && (
                <Suspense fallback={
                  <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-800">
                    <div className="text-center text-gray-400">
                      <div className="mb-2">🔄 Carregando gráfico...</div>
                      <div className="text-sm">Preparando dados para {chartType === 'spread' ? 'Spread 24h' : 'Spot vs Futures'}</div>
                    </div>
                  </div>
                }>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-800">
                      <div className="text-center text-gray-400">
                        <div className="mb-2">⚡ Inicializando...</div>
                        <div className="text-sm">Carregando componentes do gráfico</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {chartType === 'spread' ? (
                        <div>
                          <div className="mb-3 text-sm text-gray-400">
                            Histórico de spread máximo das últimas 24 horas
                          </div>
                          <SpreadHistoryChart symbol={symbol} />
                        </div>
                      ) : (
                        <div>
                          <div className="mb-3 text-sm text-gray-400">
                            Comparação de preços spot vs futures (pontos a cada 30 min)
                          </div>
                          <PriceComparisonChart symbol={symbol} />
                        </div>
                      )}
                    </>
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
