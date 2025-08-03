'use client';

import { useState } from 'react';
import ArbitrageTable from '@/components/arbitragem/arbitrage-table';
import Sidebar from '@/components/dashboard/sidebar';
import { LayoutDashboard, Repeat, Wallet, History, Settings } from 'lucide-react';

const iconProps = { className: "h-5 w-5" };
const AppIcons = {
  LayoutDashboard: <LayoutDashboard {...iconProps} />,
  Repeat: <Repeat {...iconProps} />,
  Wallet: <Wallet {...iconProps} />,
  History: <History {...iconProps} />,
  Settings: <Settings {...iconProps} />,
};

const sidebarNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: AppIcons.LayoutDashboard },
  { title: 'Arbitragem', href: '/arbitragem', icon: AppIcons.Repeat },
  
  { title: 'Histórico', href: '/historico', icon: AppIcons.History },
  { title: 'Carteira', href: '/carteira', icon: AppIcons.Wallet },
];

export default function ArbitragemPage() {
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
        <ArbitrageTable isBigArb={false} />
      </main>
    </div>
  );
} 