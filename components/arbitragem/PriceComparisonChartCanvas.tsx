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

interface PriceComparisonChartCanvasProps {
  symbol: string;
}

interface PriceData {
  timestamp: string;
  gateio_price: number | null;
  mexc_price: number | null;
}

const localCache = new Map<string, { data: PriceData[]; timestamp: number }>();
// @ts-ignore
if (typeof window !== 'undefined') window.PriceComparisonChart_localCache = localCache;
const CACHE_DURATION = 5 * 60 * 1000;

export default function PriceComparisonChartCanvas({ symbol }: PriceComparisonChartCanvasProps) {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const cacheKey = symbol;
    const cached = localCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setData(cached.data);
      setLastUpdate(new Date(cached.timestamp));
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/price-comparison/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error('Erro ao buscar dados do gráfico Spot vs Futures');
      const result = await response.json();
      if (!Array.isArray(result)) throw new Error('Formato de dados inválido');
      setData(result);
      setLastUpdate(new Date());
      localCache.set(cacheKey, { data: result, timestamp: Date.now() });
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
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
  const labels = data.map(d => d.timestamp.includes(' - ') ? d.timestamp.split(' - ')[1] : d.timestamp);
  const gateioDataset = data.map(d => d.gateio_price === null ? undefined : d.gateio_price);
  const mexcDataset = data.map(d => d.mexc_price === null ? undefined : d.mexc_price);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Gate.io (Spot)',
        data: gateioDataset,
        borderColor: '#06b6d4', // custom-cyan
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
        borderWidth: 2,
      },
      {
        label: 'MEXC (Futures)',
        data: mexcDataset,
        borderColor: '#f59e0b', // amber-500
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        pointBackgroundColor: '#f59e0b',
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
        text: `Spot vs Futures (24h) - ${symbol}`,
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
            const value = context.parsed.y;
            if (value === undefined || value === null) {
              return `${context.dataset.label}: N/D`;
            }
            return `${context.dataset.label}: $${value.toFixed(6)}`;
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
          text: 'Preço',
          color: '#ffffff',
          font: { size: 14 }
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 12 },
          callback: function(value: string | number) {
            const num = typeof value === 'number' ? value : Number(value);
            return isNaN(num) ? '' : `$${num.toFixed(6)}`;
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
          Atualizado: {lastUpdate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} | {data.length} pontos coletados
        </div>
      )}
    </div>
  );
} 