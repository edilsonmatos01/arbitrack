import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface Spread24hChartCanvasProps {
  symbol: string;
}

interface SpreadData {
  timestamp: string;
  spread_percentage: number;
}

const localCache = new Map<string, { data: SpreadData[]; timestamp: number }>();
// @ts-ignore
if (typeof window !== 'undefined') window.Spread24hChart_localCache = localCache;
const CACHE_DURATION = 5 * 60 * 1000;

// Função utilitária para garantir array seguro
function safeArray<T>(input: any): T[] {
  return Array.isArray(input) ? input : [];
}

export default function Spread24hChartCanvas({ symbol }: Spread24hChartCanvasProps) {
  const [data, setData] = useState<SpreadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    console.log(`[Spread24hChartCanvas] Carregando dados para ${symbol}...`);
    setLoading(true);
    setError(null);
    const cacheKey = symbol;
    const cached = localCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`[Spread24hChartCanvas] Usando cache para ${symbol}: ${cached.data.length} pontos`);
      setData(cached.data);
      setLastUpdate(new Date(cached.timestamp));
      setLoading(false);
      return;
    }
    try {
      console.log(`[Spread24hChartCanvas] Fazendo fetch para ${symbol}...`);
      const response = await fetch(`/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error('Erro ao buscar dados do spread 24h');
      const result = await response.json();
      console.log(`[Spread24hChartCanvas] Resposta da API para ${symbol}:`, result.length, 'pontos');
      if (!Array.isArray(result)) throw new Error('Formato de dados inválido');
      setData(result);
      setLastUpdate(new Date());
      localCache.set(cacheKey, { data: result, timestamp: Date.now() });
      console.log(`[Spread24hChartCanvas] Dados salvos no cache para ${symbol}`);
    } catch (err: any) {
      console.error(`[Spread24hChartCanvas] Erro para ${symbol}:`, err);
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    // Limpar cache para forçar nova busca
    localCache.delete(symbol);
    console.log(`[Spread24hChartCanvas] Cache limpo para ${symbol}`);
    
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && data.length === 0) {
    return <div className="flex items-center justify-center h-96 bg-dark-card rounded-lg border border-gray-700 text-gray-300">Carregando gráfico...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-96 bg-dark-card rounded-lg border border-gray-700 text-red-400">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-96 bg-dark-card rounded-lg border border-gray-700 text-gray-400">Nenhum dado disponível</div>;
  }

  // Chart.js espera labels e datasets
  const labels = safeArray<SpreadData>(data).map(d => d.timestamp.includes(' - ') ? d.timestamp.split(' - ')[1] : d.timestamp);
  const dataset = safeArray<SpreadData>(data).map(d => d.spread_percentage);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Spread (%)',
        data: dataset,
        borderColor: '#06b6d4', // custom-cyan
        backgroundColor: 'rgba(6, 182, 212, 0.1)', // custom-cyan com transparência
        pointBackgroundColor: '#06b6d4', // custom-cyan
        pointBorderColor: '#ffffff',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { 
          color: '#ffffff',
          font: { size: 14 }
        }
      },
      title: {
        display: true,
        text: `Histórico de Spread Máximo (24h) - ${symbol}`,
        color: '#ffffff',
        font: { size: 18 }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#06b6d4',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `Spread: ${context.parsed.y.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Horário',
          color: '#ffffff',
          font: { size: 14 }
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 12,
          font: { size: 12 }
        },
        grid: {
          color: '#374151',
          drawBorder: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Spread (%)',
          color: '#ffffff',
          font: { size: 14 }
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 12 },
          callback: function(value: string | number) {
            const num = typeof value === 'number' ? value : Number(value);
            return isNaN(num) ? '' : `${num.toFixed(2)}%`;
          }
        },
        grid: {
          color: '#374151',
          drawBorder: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  return (
    <div className="w-full h-full bg-dark-card rounded-lg border border-gray-700 p-4 flex flex-col">
      <div className="flex-1 min-h-0">
        <Line data={chartData} options={options} />
      </div>
      {lastUpdate && (
        <div className="text-right text-xs text-gray-400 mt-2 flex-shrink-0">
          Atualizado: {lastUpdate.toLocaleString('pt-BR')} | {safeArray(data).length} pontos coletados
        </div>
      )}
    </div>
  );
} 