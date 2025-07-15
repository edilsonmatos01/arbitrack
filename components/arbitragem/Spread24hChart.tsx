'use client';

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
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

interface Spread24hChartProps {
  symbol: string;
}

interface SpreadData {
  timestamp: string;
  spread: number;
}

const SPREAD_HISTORY_LIMIT = 48; // 24 horas com intervalos de 30 minutos

const formatToBrazilTime = (timestamp: string) => {
  if (dayjs(timestamp).isValid()) {
    return dayjs(timestamp).tz('America/Sao_Paulo').format('DD/MM - HH:mm');
  }
  return timestamp;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="p-3 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
        <p className="text-white font-semibold mb-2">{formatToBrazilTime(label || '')}</p>
        <p className="text-green-400">
          {`Spread Máximo (%): ${typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

export default function Spread24hChart({ symbol }: Spread24hChartProps) {
  const [data, setData] = useState<SpreadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega dados históricos da API
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/spread-history?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (Array.isArray(result)) {
        setData(result.slice(-SPREAD_HISTORY_LIMIT));
      } else {
        throw new Error('Formato de resposta inválido');
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadInitialData();
  }, [symbol, loadInitialData]);

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center text-gray-400">
          <div className="mb-2">🔄 Carregando histórico de spread...</div>
          <div className="text-sm">Buscando dados das últimas 24 horas para {symbol}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center text-red-400">
          <div className="mb-2">⚠️ {error}</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center text-gray-400">
          <div className="mb-2">📊 Coletando dados...</div>
        </div>
      </div>
    );
  }

  const minSpread = Math.min(...data.map(d => d.spread));
  const maxSpread = Math.max(...data.map(d => d.spread));
  const padding = (maxSpread - minSpread) * 0.1;

  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Histórico de Spread Máximo (24h) - {symbol}</h3>
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
            tickFormatter={formatToBrazilTime}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={(value) => `${value.toFixed(2)}%`}
            domain={[minSpread - padding, maxSpread + padding]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="spread"
            name="Spread Máximo (%)"
            stroke="#10B981"
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