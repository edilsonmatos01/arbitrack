import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useChartCache } from '@/lib/chart-cache';

interface InstantSpread24hChartProps {
  symbol: string;
  initialData?: Array<{ timestamp: string; spread_percentage: number }>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number | null;
    dataKey: string;
    name: string;
  }>;
  label?: string;
}

function formatTimestampToLocal(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(', ', ' - ');
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="p-3 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
        <p className="text-white font-semibold mb-2">{`Data: ${label}`}</p>
        <p className="text-green-400">{`Spread (%): ${payload[0].value?.toFixed(2) ?? 'N/D'}`}</p>
      </div>
    );
  }
  return null;
};

// Skeleton loader otimizado
function OptimizedSkeleton() {
  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 bg-gray-700 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse" />
      </div>
      <div className="w-full h-64 bg-gray-800 rounded animate-pulse" />
    </div>
  );
}

export default function InstantSpread24hChart({ symbol, initialData }: InstantSpread24hChartProps) {
  const [data, setData] = useState<Array<{ timestamp: string; spread_percentage: number }>>(initialData || []);
  const [loading, setLoading] = useState(!initialData || initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const { fetchSpreadData, prefetchData } = useChartCache();

  // Carregar dados com cache otimizado
  const loadData = useCallback(async () => {
    if (initialData && initialData.length > 0) {
      setData(initialData);
      setLastUpdate(new Date());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`[InstantSpread24hChart] Carregando dados para ${symbol}...`);
      const result = await fetchSpreadData(symbol);
      
      if (result.length > 0) {
        setData(result);
        setLastUpdate(new Date());
        console.log(`[InstantSpread24hChart] Dados carregados: ${result.length} pontos`);
      } else {
        setError('Nenhum dado disponível');
      }
    } catch (err: any) {
      console.error(`[InstantSpread24hChart] Erro para ${symbol}:`, err);
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, initialData, fetchSpreadData]);

  // Carregar dados iniciais
  useEffect(() => {
    if (!initialData || initialData.length === 0) {
      loadData();
    } else {
      setData(initialData);
      setLastUpdate(new Date());
      setLoading(false);
    }
  }, [symbol, initialData]); // Removido loadData e prefetchData das dependências

  // Pré-carregar dados para atualizações futuras (apenas uma vez)
  useEffect(() => {
    prefetchData(symbol);
  }, [symbol]); // Apenas symbol como dependência

  // Atualizar dados a cada 2 minutos (mais frequente para dados mais frescos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && (!initialData || initialData.length === 0)) {
        loadData();
      }
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [symbol, loading, initialData]); // Removido loadData das dependências

  // Renderizar skeleton apenas se não houver dados iniciais
  if (loading && (!initialData || initialData.length === 0)) {
    return <OptimizedSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center text-red-400">
          <div className="mb-2">⚠️ {error}</div>
          <div className="text-sm text-gray-400">Verifique a API ou conexão</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center text-gray-400">
          <div className="mb-2">📊 Nenhum dado disponível</div>
          <div className="text-sm">Aguarde a coleta de dados do spread</div>
        </div>
      </div>
    );
  }

  const minSpread = Math.min(...data.map(d => d.spread_percentage));
  const maxSpread = Math.max(...data.map(d => d.spread_percentage));
  const padding = (maxSpread - minSpread) * 0.1;

  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Histórico de Spread Máximo (24h) - {symbol}</h3>
          {loading && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </div>
        {lastUpdate && (
          <div className="text-right">
            <div className="text-sm text-gray-400">
              Atualizado: {lastUpdate.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-gray-500">
              {data.length} pontos coletados
            </div>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={Math.max(0, Math.floor(data.length / 12))}
            tickFormatter={(value) => {
              if (typeof value === 'string' && value.includes(' - ')) {
                return value.split(' - ')[1]; // Mostra só o horário
              }
              return value;
            }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={(value) => `${value.toFixed(2)}%`}
            domain={[minSpread - padding, maxSpread + padding]}
          />
          <Tooltip content={<CustomTooltip />} labelFormatter={formatTimestampToLocal} />
          <Line
            type="monotone"
            dataKey="spread_percentage"
            name="Spread (%)"
            stroke="#34D399"
            dot={{ r: 2 }}
            strokeWidth={2}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 