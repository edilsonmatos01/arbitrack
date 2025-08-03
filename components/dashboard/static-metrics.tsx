'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Activity, Target, Users, Clock } from 'lucide-react';

interface OperationHistory {
  id: string;
  symbol: string;
  quantity: number;
  spotEntryPrice: number;
  futuresEntryPrice: number;
  spotExitPrice: number;
  futuresExitPrice: number;
  spotExchange: string;
  futuresExchange: string;
  profitLossUsd: number;
  profitLossPercent: number;
  createdAt: string;
  finalizedAt: string;
}

interface ApiConfiguration {
  id: string;
  exchange: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MetricData {
  totalOperations: number;
  averageSpread: number;
  successRate: number;
  activeExchanges: number;
  averageTime: number;
}

export default function StaticMetrics() {
  const [metrics, setMetrics] = useState<MetricData>({
    totalOperations: 0,
    averageSpread: 0,
    successRate: 0,
    activeExchanges: 0,
    averageTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Buscar dados em paralelo
        const [operationsRes, configsRes] = await Promise.all([
          fetch('/api/operation-history?filter=all'),
          fetch('/api/config/api-keys')
        ]);

        const operations: OperationHistory[] = await operationsRes.json();
        const configs: ApiConfiguration[] = await configsRes.json();

        // Calcular exchanges ativas (configuradas e ativas)
        const activeExchanges = configs.filter(config => config.isActive).length;

        if (Array.isArray(operations) && operations.length > 0) {
          // Calcular métricas reais
          const totalOperations = operations.length;
          
          // Calcular spread médio (baseado no profit/loss percent)
          const averageSpread = operations.reduce((sum, op) => sum + Math.abs(op.profitLossPercent), 0) / totalOperations;
          
          // Calcular taxa de sucesso (operações com lucro)
          const successfulOperations = operations.filter(op => op.profitLossUsd > 0).length;
          const successRate = (successfulOperations / totalOperations) * 100;
          
          // Calcular tempo médio das operações (em minutos)
          const totalTime = operations.reduce((sum, op) => {
            const created = new Date(op.createdAt).getTime();
            const finalized = new Date(op.finalizedAt).getTime();
            return sum + (finalized - created);
          }, 0);
          const averageTime = totalTime / totalOperations / (1000 * 60); // converter para minutos

          setMetrics({
            totalOperations,
            averageSpread,
            successRate,
            activeExchanges,
            averageTime
          });
        } else {
          // Se não houver operações, usar valores zerados mas manter exchanges ativas
          setMetrics({
            totalOperations: 0,
            averageSpread: 0,
            successRate: 0,
            activeExchanges,
            averageTime: 0
          });
        }
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        // Manter valores zerados em caso de erro
        setMetrics({
          totalOperations: 0,
          averageSpread: 0,
          successRate: 0,
          activeExchanges: 0,
          averageTime: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const metricsData = [
    {
      title: 'Operações Realizadas',
      value: isLoading ? '...' : metrics.totalOperations.toString(),
      subtitle: metrics.totalOperations === 0 ? 'Aguardando operações' : 'Total histórico',
      icon: Activity,
      color: 'text-blue-400'
    },
    {
      title: 'Spread Médio',
      value: isLoading ? '...' : metrics.totalOperations === 0 ? '0.00%' : `${metrics.averageSpread.toFixed(2)}%`,
      subtitle: metrics.totalOperations === 0 ? 'Aguardando dados' : 'Média das operações',
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      title: 'Taxa de Sucesso',
      value: isLoading ? '...' : metrics.totalOperations === 0 ? '0.0%' : `${metrics.successRate.toFixed(1)}%`,
      subtitle: metrics.totalOperations === 0 ? 'Aguardando operações' : 'Operações lucrativas',
      icon: Target,
      color: 'text-emerald-400'
    },
    {
      title: 'Exchanges Ativas',
      value: isLoading ? '...' : metrics.activeExchanges.toString(),
      subtitle: metrics.activeExchanges > 0 ? `${metrics.activeExchanges} configurada${metrics.activeExchanges !== 1 ? 's' : ''}` : 'Nenhuma configurada',
      icon: Users,
      color: 'text-purple-400'
    },
    {
      title: 'Tempo Médio',
      value: isLoading ? '...' : metrics.totalOperations === 0 ? '0.0min' : `${metrics.averageTime.toFixed(1)}min`,
      subtitle: metrics.totalOperations === 0 ? 'Aguardando operações' : 'Por operação',
      icon: Clock,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {metricsData.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div key={index} className="bg-dark-card p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  {metric.title}
                </h3>
              </div>
              <IconComponent className={`h-5 w-5 ${metric.color}`} />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {metric.value}
              </div>
              <p className="text-xs text-gray-400">
                {metric.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
} 