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

interface Spread24hChartProps {
  symbol: string;
}

interface SpreadData {
  timestamp: string; // ISO string
  spread_percentage: number;
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

// Cache local por símbolo (dura 5 minutos)
const localCache = new Map<string, { data: SpreadData[]; timestamp: number }>();
// @ts-ignore
if (typeof window !== 'undefined') window.Spread24hChart_localCache = localCache;
const CACHE_DURATION = 5 * 60 * 1000;

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

// Skeleton loader para feedback visual
function SkeletonChart() {
  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-800 p-4 animate-pulse flex flex-col justify-center items-center">
      <div className="w-3/4 h-8 bg-gray-700 rounded mb-6" />
      <div className="w-full h-64 bg-gray-800 rounded" />
    </div>
  );
}

export default function Spread24hChart({ symbol }: Spread24hChartProps) {
  const [data, setData] = useState<SpreadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Função para buscar dados com cache local
  const loadData = useCallback(async () => {
    console.log(`[Spread24hChart] Carregando dados para ${symbol}...`);
    setLoading(true);
    setError(null);
    const cacheKey = symbol;
    const cached = localCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`[Spread24hChart] Usando cache para ${symbol}: ${cached.data.length} pontos`);
      setData(cached.data);
      setLastUpdate(new Date(cached.timestamp));
      setLoading(false);
      return;
    }
    try {
      console.log(`[Spread24hChart] Fazendo fetch para ${symbol}...`);
      const response = await fetch(`/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error('Erro ao buscar dados do spread 24h');
      const result = await response.json();
      console.log(`[Spread24hChart] Resposta da API para ${symbol}:`, result.length, 'pontos');
      if (!Array.isArray(result)) throw new Error('Formato de dados inválido');
      setData(result);
      setLastUpdate(new Date());
      localCache.set(cacheKey, { data: result, timestamp: Date.now() });
      console.log(`[Spread24hChart] Dados salvos no cache para ${symbol}`);
    } catch (err: any) {
      console.error(`[Spread24hChart] Erro para ${symbol}:`, err);
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    // Limpar cache para forçar nova busca
    localCache.delete(symbol);
    console.log(`[Spread24hChart] Cache limpo para ${symbol}`);
    
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000); // Atualiza a cada 5 min
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && data.length === 0) {
    return <SkeletonChart />;
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