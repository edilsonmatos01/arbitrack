'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Wallet, TrendingUp } from 'lucide-react';

interface ExchangeBalance {
  name: string;
  type: 'spot' | 'futures';
  balance: number;
  isLoading: boolean;
  error: string | null;
}

interface BalanceItem {
  currency?: string; // Gate.io usa currency
  asset?: string;    // MEXC usa asset
  available?: string; // Gate.io
  free?: string;       // MEXC
  locked?: string;
}

interface ApiResponse {
  balances?: BalanceItem[];
  error?: string;
  details?: string;
}

export default function RealBalanceCard() {
  const [exchanges, setExchanges] = useState<ExchangeBalance[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exchangeConfigs, setExchangeConfigs] = useState([
    { name: 'Gate.io', key: 'gateio', type: 'spot' as const, endpoint: '/api/gateio/wallet-balance' },
    { name: 'MEXC', key: 'mexc', type: 'futures' as const, endpoint: '/api/mexc/wallet-balance' }
  ]);

  // Configurações de todas as exchanges suportadas  
  const allExchangeConfigs = [
    { name: 'Gate.io', key: 'gateio', type: 'spot' as const, endpoint: '/api/gateio/wallet-balance' },
    { name: 'MEXC', key: 'mexc', type: 'futures' as const, endpoint: '/api/mexc/wallet-balance' }
  ];

  // Função para carregar exchanges configuradas
  const loadConfiguredExchanges = async () => {
    try {
      const response = await fetch('/api/config/api-keys');
      if (response.ok) {
        const configuredExchanges = await response.json();
        
        // Filtrar apenas exchanges que estão configuradas e ativas
        const activeExchangeKeys = configuredExchanges
          .filter((config: any) => config.isActive)
          .map((config: any) => config.exchange);
        
        // Filtrar as configurações para incluir apenas exchanges ativas
        const activeConfigs = allExchangeConfigs.filter(config => 
          activeExchangeKeys.includes(config.key)
        );
        
        // Se não há exchanges configuradas, manter Gate.io e MEXC como padrão
        if (activeConfigs.length === 0) {
          setExchangeConfigs(allExchangeConfigs.slice(0, 2));
        } else {
          setExchangeConfigs(activeConfigs);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar exchanges configuradas:', error);
      // Em caso de erro, manter configuração padrão
      setExchangeConfigs(allExchangeConfigs.slice(0, 2));
    }
  };

  const fetchExchangeBalance = async (exchangeName: string, endpoint: string): Promise<number> => {
    try {
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      let usdtBalance = 0;
      if (data.balances) {
        const usdtEntry = data.balances.find(b => {
          // Diferentes exchanges usam diferentes campos para o nome da moeda
          return (b.asset === 'USDT' || b.currency === 'USDT' || (b as any).coin === 'USDT');
        });
        
        if (usdtEntry) {
          // Diferentes exchanges usam diferentes campos para valores
          let freeAmount = 0;
          let lockedAmount = 0;
          
          // Gate.io usa 'available' e 'locked'
          if (usdtEntry.available) {
            freeAmount = parseFloat(usdtEntry.available);
            lockedAmount = parseFloat(usdtEntry.locked || '0');
          }
          // Binance, MEXC usam 'free' e 'locked'
          else if (usdtEntry.free) {
            freeAmount = parseFloat(usdtEntry.free);
            lockedAmount = parseFloat(usdtEntry.locked || '0');
          }
          // Bybit usa 'walletBalance' 
          else if ((usdtEntry as any).walletBalance) {
            freeAmount = parseFloat((usdtEntry as any).walletBalance);
            lockedAmount = parseFloat((usdtEntry as any).locked || '0');
          }
          // Bitget usa 'available' e 'frozen'
          else if ((usdtEntry as any).available && (usdtEntry as any).frozen !== undefined) {
            freeAmount = parseFloat((usdtEntry as any).available);
            lockedAmount = parseFloat((usdtEntry as any).frozen || '0');
          }
          
          usdtBalance = freeAmount + lockedAmount;
        }
      }
      
      return usdtBalance;
    } catch (error) {
      console.error(`Erro ao buscar saldo da ${exchangeName}:`, error);
      throw error;
    }
  };

  const fetchAllBalances = async () => {
    if (!isRefreshing) {
      setExchanges(prev => prev.map(ex => ({ ...ex, isLoading: true, error: null })));
    }

    const updatedExchanges = await Promise.all(
      exchangeConfigs.map(async (config) => {
        try {
          const balance = await fetchExchangeBalance(config.name, config.endpoint);
          return {
            name: config.name,
            type: config.type,
            balance,
            isLoading: false,
            error: null
          };
        } catch (error) {
          return {
            name: config.name,
            type: config.type,
            balance: 0,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          };
        }
      })
    );

    setExchanges(updatedExchanges);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const initializeComponent = async () => {
      await loadConfiguredExchanges();
      fetchAllBalances();
    };
    
    initializeComponent();
  }, []);

  // Recarregar saldos quando as exchanges configuradas mudarem
  useEffect(() => {
    if (exchangeConfigs.length > 0) {
      // Inicializar o estado com as exchanges configuradas
      setExchanges(exchangeConfigs.map(config => ({
        name: config.name,
        type: config.type,
        balance: 0,
        isLoading: true,
        error: null
      })));
      fetchAllBalances();
    }
  }, [exchangeConfigs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllBalances();
  };

  const totalBalance = exchanges.reduce((sum, ex) => sum + ex.balance, 0);
  const hasErrors = exchanges.some(ex => ex.error);
  const isLoading = exchanges.some(ex => ex.isLoading) && !isRefreshing;

  const getTypeIcon = (type: 'spot' | 'futures') => {
    return type === 'spot' ? 
      <Wallet className="h-4 w-4 text-blue-400" /> : 
      <TrendingUp className="h-4 w-4 text-purple-400" />;
  };

  const getTypeColor = (type: 'spot' | 'futures') => {
    return type === 'spot' ? 'text-blue-400' : 'text-purple-400';
  };

  return (
    <div className="bg-dark-card p-6 rounded-lg shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">Saldos das Exchanges</h3>
          <p className="text-sm text-gray-400">
            {exchangeConfigs.length} exchange{exchangeConfigs.length !== 1 ? 's' : ''} configurada{exchangeConfigs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title="Atualizar saldos"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Saldo Total */}
      <div className="mb-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-custom-cyan" />
            <span className="text-sm text-gray-400">Carregando...</span>
          </div>
        ) : (
          <div className="text-3xl font-bold text-custom-cyan">
            US$ {totalBalance.toFixed(2)}
          </div>
        )}
        <div className="text-sm text-gray-400 mt-1">Saldo Total</div>
      </div>

      {/* Detalhes por Exchange */}
      <div className="space-y-3">
        {exchanges.map((exchange, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
            <div className="flex items-center gap-3">
              {getTypeIcon(exchange.type)}
              <div>
                <div className="text-sm font-medium text-white">{exchange.name}</div>
                <div className={`text-xs ${getTypeColor(exchange.type)}`}>
                  {exchange.type === 'spot' ? 'Mercado Spot' : 'Mercado Futuros'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {exchange.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-custom-cyan" />
              ) : exchange.error ? (
                <div className="text-red-400 text-xs">Erro</div>
              ) : (
                <div className="text-white font-semibold">
                  ${exchange.balance.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Indicador de erro */}
      {hasErrors && !isLoading && (
        <div className="mt-3 text-xs text-red-400">
          Alguns saldos podem estar desatualizados
        </div>
      )}
    </div>
  );
} 