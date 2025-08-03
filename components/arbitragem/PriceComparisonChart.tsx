'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useArbitrageWebSocket } from './useArbitrageWebSocket';

interface PriceComparisonChartProps {
  symbol: string;
}

interface PriceData {
  timestamp: string;
  gateio_price: number | null;
  mexc_price: number | null;
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

const PRICE_HISTORY_LIMIT = 48; // 24 horas com intervalos de 30 minutos
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos para atualizações WebSocket

// Cache local por símbolo (dura 5 minutos)
const localCache = new Map<string, { data: PriceData[]; timestamp: number }>();
// @ts-ignore
if (typeof window !== 'undefined') window.PriceComparisonChart_localCache = localCache;
const CACHE_DURATION = 5 * 60 * 1000;

// Skeleton loader para feedback visual
function SkeletonChart() {
  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-800 p-4 animate-pulse flex flex-col justify-center items-center">
      <div className="w-3/4 h-8 bg-gray-700 rounded mb-6" />
      <div className="w-full h-64 bg-gray-800 rounded" />
    </div>
  );
}

// Substituir a função formatTimestamp para usar o fuso horário correto e mostrar HH:mm
const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
    hour12: false
  }).format(date).replace(',', ''); // Ex: '21/07 11:30'
};

// Função para arredondar para intervalos de 30 minutos
const roundToNearestInterval = (date: Date): Date => {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 30) * 30;
  const newDate = new Date(date);
  newDate.setMinutes(roundedMinutes);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
};

// Ao processar os dados, garantir que só há um ponto por horário (HH:mm)
const deduplicateData = (data: PriceData[]): PriceData[] => {
  const seen = new Set<string>();
  return data.filter(d => {
    if (seen.has(d.timestamp)) return false;
    seen.add(d.timestamp);
    return true;
  });
};

// Componente de Tooltip customizado
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const gateio = payload.find(p => p.dataKey === 'gateio_price');
    const mexc = payload.find(p => p.dataKey === 'mexc_price');

    return (
      <div className="p-3 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
        <p className="text-white font-semibold mb-2">{`Data: ${label}`}</p>
        <p className="text-green-400">
          {`Gate.io (spot): $${gateio?.value?.toLocaleString('pt-BR', { minimumFractionDigits: 8 }) || 'N/D'}`}
        </p>
        <p className="text-blue-400">
          {`MEXC (futures): $${mexc?.value?.toLocaleString('pt-BR', { minimumFractionDigits: 8 }) || 'N/D'}`}
        </p>
      </div>
    );
  }
  return null;
};

// Nova função para formatar data e hora para o eixo X
const formatXAxisLabel = (timestamp: string): string => {
  // timestamp já está no formato correto, mas vamos garantir
  // Se vier como ISO, converte para Date e formata
  let dateObj: Date;
  if (timestamp.includes('/')) {
    // Já está formatado
    return timestamp;
  } else {
    dateObj = new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
      hour12: false
    }).format(dateObj).replace(',', '');
  }
};

export default function PriceComparisonChart({ symbol }: PriceComparisonChartProps) {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const priceHistoryRef = useRef<PriceData[]>([]);
  
  // Hook para dados WebSocket em tempo real
  const { livePrices } = useArbitrageWebSocket();

  // Carrega dados históricos da API com cache local
  const loadInitialData = useCallback(async () => {
    const cacheKey = symbol;
    const cached = localCache.get(cacheKey);
    setLoading(true);
    setError(null);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setData(cached.data);
      setLastUpdate(new Date(cached.timestamp));
      setLoading(false);
      return;
    }
    try {
      console.log(`[PriceChart] Buscando dados históricos para ${symbol}...`);
      const response = await fetch(`/api/price-comparison/${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (Array.isArray(result)) {
        if (result.length > 0) {
          setData(deduplicateData(result));
          setLastUpdate(new Date());
          localCache.set(cacheKey, { data: result, timestamp: Date.now() });
          console.log(`[PriceChart] ✅ Dados históricos carregados: ${result.length} pontos`);
          console.log(`[PriceChart] Primeiro ponto:`, result[0]);
          console.log(`[PriceChart] Último ponto:`, result[result.length - 1]);
        } else {
          console.log(`[PriceChart] ⚠️ Nenhum dado histórico encontrado para ${symbol}`);
          // Busca dados reais se não houver dados históricos
          fetchRealData();
        }
      } else {
        throw new Error('Formato de resposta inválido');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('[PriceChart] ❌ Erro ao carregar dados históricos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      setLoading(false);
      
      // Em caso de erro, tenta buscar dados reais
      fetchRealData();
    }
  }, [symbol]);

  // Busca dados reais do banco quando não há dados históricos
  const fetchRealData = useCallback(async () => {
    console.log(`[PriceChart] Buscando dados reais para ${symbol}...`);
    
    try {
      const response = await fetch(`/api/spread-history/24h/${symbol}?limit=48`);
      if (response.ok) {
        const realData = await response.json();
        
        if (realData && realData.length > 0) {
          const formattedData: PriceData[] = realData.map((item: any) => ({
            timestamp: formatTimestamp(new Date(item.timestamp)),
            gateio_price: item.spotPrice,
            mexc_price: item.futuresPrice
          }));
          
          setData(deduplicateData(formattedData));
          console.log(`[PriceChart] ✅ Dados reais carregados: ${formattedData.length} pontos`);
        } else {
          console.log(`[PriceChart] ⚠️ Nenhum dado real encontrado para ${symbol}`);
          setData([]);
        }
      } else {
        console.log(`[PriceChart] ⚠️ Erro ao buscar dados reais para ${symbol}`);
        setData([]);
      }
    } catch (error) {
      console.error(`[PriceChart] ❌ Erro ao buscar dados reais:`, error);
      setData([]);
    }
  }, [symbol]);

  // Atualiza dados baseado nos preços WebSocket (apenas adiciona novos pontos)
  const updatePriceHistory = useCallback(() => {
    // Só atualiza se já temos dados históricos carregados
    if (data.length === 0) {
      return;
    }

    if (!livePrices[symbol]) {
      return;
    }

    const gateioData = livePrices[symbol]['spot']; // Gate.io Spot
    const mexcData = livePrices[symbol]['futures']; // MEXC Futures

    if (!gateioData || !mexcData) {
      return;
    }

    const now = new Date();
    const roundedTime = roundToNearestInterval(now);
    const timestamp = formatTimestamp(roundedTime);

    // Verifica se já existe um ponto para este timestamp
    const existingPoint = data.find(d => d.timestamp === timestamp);
    if (existingPoint) {
      // Já temos dados para este intervalo, não adiciona
      return;
    }

    // Calcula preço médio (bid + ask) / 2
    const gateioPrice = (gateioData.bestAsk + gateioData.bestBid) / 2;
    const mexcPrice = (mexcData.bestAsk + mexcData.bestBid) / 2;

    const newDataPoint: PriceData = {
      timestamp,
      gateio_price: gateioPrice,
      mexc_price: mexcPrice
    };

    setData(prevData => {
      // Adiciona novo ponto e mantém apenas os últimos 48 pontos (24h)
      const updatedData = [...prevData, newDataPoint]
        .sort((a, b) => {
          const [dateA, timeA] = a.timestamp.split(' - ');
          const [dateB, timeB] = b.timestamp.split(' - ');
          const [dayA, monthA] = dateA.split('/').map(Number);
          const [dayB, monthB] = dateB.split('/').map(Number);
          const [hourA, minuteA] = timeA.split(':').map(Number);
          const [hourB, minuteB] = timeB.split(':').map(Number);
          
          if (monthA !== monthB) return monthA - monthB;
          if (dayA !== dayB) return dayA - dayB;
          if (hourA !== hourB) return hourA - hourB;
          return minuteA - minuteB;
        })
        .slice(-PRICE_HISTORY_LIMIT);

      return updatedData;
    });

    setLastUpdate(now);

    console.log(`[PriceChart] ✅ Novo ponto WebSocket adicionado para ${symbol}:`, {
      timestamp,
      gateio_price: gateioPrice.toFixed(8),
      mexc_price: mexcPrice.toFixed(8),
      totalPoints: data.length + 1
    });
  }, [symbol, livePrices, data]);

  // Carrega dados históricos ao inicializar
  useEffect(() => {
    console.log(`[PriceChart] Iniciando monitoramento para ${symbol}`);
    loadInitialData();
  }, [symbol, loadInitialData]);

  // Atualiza dados quando recebe novos preços WebSocket
  useEffect(() => {
    updatePriceHistory();
  }, [updatePriceHistory]);

  // Atualiza dados em intervalos regulares
  useEffect(() => {
    const interval = setInterval(updatePriceHistory, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [updatePriceHistory]);

  if (loading && data.length === 0) {
    return <SkeletonChart />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center text-red-400">
          <div className="mb-2">⚠️ {error}</div>
          <div className="text-sm text-gray-400">Verifique a conexão WebSocket</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center text-gray-400">
          <div className="mb-2">📊 Coletando dados...</div>
          <div className="text-sm">Dados serão exibidos conforme chegam via WebSocket</div>
        </div>
      </div>
    );
  }

  const allPrices = data.flatMap(d => [d.gateio_price, d.mexc_price] as number[]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Histórico de Preços (24h) - {symbol}</h3>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">WebSocket</span>
          </div>
        </div>
        {lastUpdate && (
          <div className="text-right">
            <div className="text-sm text-gray-400">
              Atualizado: {lastUpdate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
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
            interval={Math.max(0, Math.floor(data.length / 12))} // Mostra aproximadamente 12 marcações
            tickFormatter={formatXAxisLabel}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={(value) => `$${value.toFixed(6)}`}
            domain={[minPrice - padding, maxPrice + padding]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          <Line 
            type="monotone" 
            dataKey="gateio_price" 
            name="Gate.io (Spot)" 
            stroke="#86EFAC" 
            dot={{ r: 2 }} 
            strokeWidth={2} 
            connectNulls 
            isAnimationActive={false} 
          />
          <Line 
            type="monotone" 
            dataKey="mexc_price" 
            name="MEXC (Futures)" 
            stroke="#60A5FA" 
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