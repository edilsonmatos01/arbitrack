'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartDataPoint {
  timestamp: string;
  spread_percentage: number; // Estrutura correta da API
}

interface InstantSpread24hChartProps {
  symbol: string;
  preloadedData: ChartDataPoint[];
}

export default function InstantSpread24hChart({ symbol, preloadedData }: InstantSpread24hChartProps) {
  console.log('[InstantSpread24hChart] Componente renderizado para:', symbol);
  console.log('[InstantSpread24hChart] Dados recebidos:', preloadedData);
  
  const chartRef = useRef<any>(null);

  // Função para converter timestamp da API para Date - MOVIDA PARA CIMA
  const parseTimestamp = (timestamp: string): Date => {
    // Formato da API: "18/07 - 05:30"
    const [datePart, timePart] = timestamp.split(' - ');
    const [day, month] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    
    // Criar data para o ano atual
    const currentYear = new Date().getFullYear();
    return new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  };

  // Nova função para formatar data e hora para o eixo X
  const formatLabel = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
      hour12: false
    }).format(date).replace(',', ''); // Ex: '21/07 11:30'
  };

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!preloadedData || preloadedData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    console.log('[InstantSpread24hChart] Dados recebidos:', preloadedData);

    // Ordenar dados por timestamp
    const sortedData = [...preloadedData].sort((a, b) => {
      // Converter timestamp para data válida
      const dateA = parseTimestamp(a.timestamp);
      const dateB = parseTimestamp(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });

    console.log('[InstantSpread24hChart] Dados ordenados:', sortedData);

    // Preparar labels (horários)
    const labels = sortedData.map(point => {
      const date = parseTimestamp(point.timestamp);
      return formatLabel(date);
    });

    // Preparar dados de spread usando a estrutura correta
    const spreadData = sortedData.map(point => point.spread_percentage);

    console.log('[InstantSpread24hChart] Labels:', labels);
    console.log('[InstantSpread24hChart] Spread data:', spreadData);

    // Calcular estatísticas
    const maxSpread = Math.max(...spreadData);
    const minSpread = Math.min(...spreadData);
    const avgSpread = spreadData.reduce((a, b) => a + b, 0) / spreadData.length;

    return {
      labels,
      datasets: [
        {
          label: 'Spread (%)',
          data: spreadData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: 'rgb(34, 197, 94)',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        }
      ],
      stats: {
        max: maxSpread,
        min: minSpread,
        avg: avgSpread,
        count: spreadData.length
      }
    };
  }, [preloadedData]);

  // Configurações do gráfico
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        callbacks: {
          title: (context: any) => {
            return `Horário: ${context[0].label}`;
          },
          label: (context: any) => {
            return `Spread: ${context.parsed.y.toFixed(4)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Horário',
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 8
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Spread (%)',
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: any) => `${value.toFixed(2)}%`
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 4
      }
    }
  }), []);

  // Atualizar gráfico quando dados mudarem
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [chartData]);

  if (!preloadedData || preloadedData.length === 0) {
    console.log('[InstantSpread24hChart] Nenhum dado disponível');
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p>Nenhum dado disponível para {symbol}</p>
        </div>
      </div>
    );
  }

  const stats = chartData.stats || { max: 0, min: 0, avg: 0, count: 0 };
  
  console.log('[InstantSpread24hChart] Renderizando gráfico com:', {
    symbol,
    dataPoints: preloadedData.length,
    chartData,
    stats
  });

  return (
    <div className="h-full flex flex-col">
      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-gray-400">Spread Máximo</div>
          <div className="text-lg font-bold text-green-400">
            {stats.max.toFixed(2)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">Spread Mínimo</div>
          <div className="text-lg font-bold text-red-400">
            {stats.min.toFixed(2)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">Spread Médio</div>
          <div className="text-lg font-bold text-blue-400">
            {stats.avg.toFixed(2)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">Total de Registros</div>
          <div className="text-lg font-bold text-gray-300">
            {stats.count}
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="flex-1 min-h-0">
        <div className="h-full w-full">
          <Line 
            ref={chartRef}
            data={chartData}
            options={options}
          />
        </div>
      </div>

      {/* Informações */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Símbolo: {symbol}</span>
          <span>Período: Últimas 24 horas</span>
          <span>Atualizado: {new Date().toLocaleTimeString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
} 