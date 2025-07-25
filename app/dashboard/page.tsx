'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import ArbitrageHistoryChart from '@/components/dashboard/arbitrage-history-chart';
import ManualTotalBalanceCard from '@/components/dashboard/manual-total-balance-card';
import StaticMetrics from '@/components/dashboard/static-metrics';
import EnhancedPercentageGauge from '@/components/dashboard/enhanced-percentage-gauge';
import SoundAlertControls from '@/components/arbitragem/SoundAlertControls';
import { LayoutDashboard, Repeat, Wallet, History, Settings, AlertCircle } from 'lucide-react';

// Ícones Lucide com estilo
const iconProps = { className: "h-5 w-5" };
const AppIcons = {
  LayoutDashboard: <LayoutDashboard {...iconProps} />,
  Repeat: <Repeat {...iconProps} />,
  Wallet: <Wallet {...iconProps} />,
  History: <History {...iconProps} />,
  Settings: <Settings {...iconProps} />,
};

export default function DashboardPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const sidebarNavItems = [
    { title: 'Dashboard', href: '/dashboard', icon: AppIcons.LayoutDashboard },
    { title: 'Arbitragem', href: '/arbitragem', icon: AppIcons.Repeat },
    { title: 'Histórico', href: '/historico', icon: AppIcons.History },
    { title: 'Carteira', href: '/carteira', icon: AppIcons.Wallet },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-cyan mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Carregando Dashboard...</h1>
          <p className="text-gray-400">Inicializando componentes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dark-bg text-white">
      <Sidebar
        user={{ 
          name: 'Arbitrack',
          imageUrl: '/images/avatar.png.png'
        }}
        navItems={sidebarNavItems}
      />
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-white">Seja bem vindo(a)</h1>
          <p className="text-custom-cyan">Visão geral do sistema de arbitragem</p>
        </header>

        {error && (
          <div className="mb-4 p-4 bg-red-800 border border-red-600 text-white rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-3 text-red-300 flex-shrink-0" />
            <div>
              <p className="font-semibold">Erro ao carregar dados:</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Seção de Saldo Total */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <ManualTotalBalanceCard />
            <div className="lg:col-span-3">
              <div className="card-enhanced card-neon h-full flex flex-col justify-center">
                <h2 className="text-xl font-semibold text-white mb-2">Sistema de Arbitragem</h2>
                <p className="text-gray-400 mb-4">
                  Plataforma otimizada para identificação e execução de oportunidades de arbitragem 
                  entre múltiplas exchanges de criptomoedas.
                </p>
                                 <div className="flex items-center gap-4 text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                     <span className="text-green-400">Sistema Ativo</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção de Métricas */}
        <section className="mb-8">
          <StaticMetrics />
        </section>

        {/* Seção de Gráfico e Performance */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-enhanced card-neon">
              <ArbitrageHistoryChart />
            </div>
            <div className="card-enhanced card-neon">
              <h2 className="text-xl font-semibold text-white mb-4">Performance Acumulada</h2>
              <EnhancedPercentageGauge />
            </div>
          </div>
        </section>

        {/* Seção de Alertas Sonoros */}
        <section className="mb-8">
          <SoundAlertControls />
        </section>
      </main>
    </div>
  );
} 