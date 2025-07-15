'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SpreadHistoryChartProps {
  symbol: string;
}

interface SpreadData {
  timestamp: string;
  spread_percentage: number;
}



// Componente de Tooltip customizado para formatar os valores
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
        <p className="label text-white font-semibold mb-2">{`${label}`}</p>
        <p className="intro text-green-400">{`Spread (%): ${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

export default function SpreadHistoryChart({ symbol }: SpreadHistoryChartProps) {
  const [data, setData] = useState<SpreadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // 🚀 MELHORIA: Memoização de dados processados
  const processedData = useMemo(() => {
    if (!data.length) return [];
    
    // Dados de spread (formato atual)
    return data.map(item => ({
      ...item,
      value: item.spread_percentage,
      label: 'Spread (%)'
    }));
  }, [data]);

  // 🚀 MELHORIA 3: Atualização direta (sem debounce desnecessário)
  const updateData = useCallback((newData: SpreadData[]) => {
    setData(newData);
  }, []);

  const fetchData = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar a API corrigida com timezone
      const response = await fetch(`/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      
      if (response.status === 429) {
        // Too Many Requests - aguardar e tentar novamente
        if (retryCount < 3) {
          console.log(`[Retry] Too Many Requests, tentando novamente em 5s... (${retryCount + 1}/3)`);
          setTimeout(() => fetchData(true), 5000);
          return;
        } else {
          throw new Error('Muitas requisições. Tente novamente em alguns minutos.');
        }
      }
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const rawData: SpreadData[] = await response.json();
      
      // Atualizar dados diretamente
      updateData(rawData);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, retryCount, updateData]);

  useEffect(() => {
    if (symbol) {
      fetchData();
    }
  }, [symbol, fetchData]);

  // Função para tentar novamente manualmente
  const handleRetry = () => {
    setRetryCount(0);
    fetchData();
  };

  // Memoização das opções do gráfico
  const chartOptions = useMemo(() => ({
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    },
    yAxisDomain: ['dataMin', 'dataMax'],
    yAxisTickFormatter: (value: number) => `${value.toFixed(2)}%`,
    yAxisTitle: 'Spread (%)'
  }), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center text-gray-400">
          <div className="mb-2">🔄 Carregando dados...</div>
          {retryCount > 0 && (
            <div className="text-sm">Tentativa {retryCount}/3</div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <div className="text-red-400 mb-4">{error}</div>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-gray-400">Nenhum dado disponível</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Título do gráfico */}
      <div className="mb-4 p-2 bg-gray-800 rounded-lg">
        <h3 className="text-white font-semibold">{symbol}</h3>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={chartOptions.margin}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(value) => value.split(' - ')[1]}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={chartOptions.yAxisTickFormatter}
              domain={chartOptions.yAxisDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="linear"
              dataKey="value"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3, fill: "#10B981" }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 