"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, DollarSign } from 'lucide-react';

interface ManualBalance {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ManualTotalBalanceCard() {
  const [balances, setBalances] = useState<ManualBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadBalances = async () => {
    try {
      const response = await fetch('/api/config/manual-balances');
      if (response.ok) {
        const data = await response.json();
        setBalances(data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError('Erro ao carregar saldos');
      }
    } catch (error) {
      console.error('Erro ao carregar saldo total:', error);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBalances();
  };

  const totalBalance = balances.reduce((sum, balance) => {
    // Converter tudo para USDT para o cálculo total
    if (balance.currency === 'USDT' || balance.currency === 'USD') {
      return sum + balance.amount;
    }
    // Para outras moedas, usar valor aproximado (pode ser melhorado com API de preços)
    return sum + balance.amount;
  }, 0);

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USDT' || currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(8)} ${currency}`;
  };

  return (
    <div className="bg-dark-card p-6 rounded-lg shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">Saldo Total</h3>
          <p className="text-sm text-gray-400">
            {balances.length > 0 
              ? `${balances.length} saldo${balances.length !== 1 ? 's' : ''} adicionado${balances.length !== 1 ? 's' : ''} manualmente`
              : 'Nenhum saldo adicionado'
            }
          </p>
          {lastUpdate && (
            <div className="text-xs text-gray-500 mt-1">
              Atualizado: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title="Atualizar saldo"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing || (isLoading && !isRefreshing) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mt-2">
        {(isLoading && !isRefreshing) ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-custom-cyan" />
            <span className="text-sm text-gray-400">Carregando saldos...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : balances.length === 0 ? (
          <div className="text-center py-4">
            <DollarSign className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <div className="text-gray-400 text-sm">Nenhum saldo adicionado</div>
            <div className="text-gray-500 text-xs mt-1">
              Adicione saldos em Carteira
            </div>
          </div>
        ) : (
          <div>
            <div className="text-3xl font-bold text-custom-cyan">
              US$ {totalBalance.toFixed(2)}
            </div>
            
            {/* Detalhes dos saldos */}
            {balances.length > 0 && (
              <div className="mt-4 space-y-2">
                {balances.map((balance) => (
                  <div key={balance.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-custom-cyan rounded-full"></div>
                      <span className="text-gray-300">{balance.name}</span>
                    </div>
                    <span className="text-gray-400">
                      {formatCurrency(balance.amount, balance.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 