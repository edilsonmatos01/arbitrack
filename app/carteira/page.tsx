"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ManualBalanceManager from '@/components/carteira/manual-balance-manager';

export default function CarteiraPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header com botão de voltar */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Carteira</h1>
          <p className="text-gray-400">
            Gerencie seus saldos manuais para exibição no dashboard. O sistema utiliza apenas dados públicos das exchanges via WebSocket.
          </p>
        </div>

        {/* Aviso sobre dados públicos */}
        <div className="mb-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400 font-medium">ℹ️ Sistema de Dados Públicos</span>
          </div>
          <p className="text-blue-300 text-sm">
            Este sistema utiliza apenas dados públicos das exchanges (Gate.io e MEXC) via WebSocket. 
            Não são necessárias chaves de API privadas. Os dados de preços e spreads são obtidos em tempo real 
            através de conexões WebSocket públicas.
          </p>
        </div>

        {/* Seção de Saldo Total */}
        <div className="mt-8">
          <ManualBalanceManager />
        </div>
      </div>
    </div>
  );
} 