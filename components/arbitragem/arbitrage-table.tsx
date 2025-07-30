"use client";
import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { Play, RefreshCw, AlertTriangle, CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react'; // Ícones
import { useArbitrageWebSocket } from './useArbitrageWebSocket';
import { usePreloadData } from './usePreloadData';
import InstantMaxSpreadCell from './InstantMaxSpreadCell'; // Importar o componente otimizado
import React from 'react';
import Decimal from 'decimal.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FinalizePositionModal from './FinalizePositionModal';
import { OperationHistoryStorage } from '@/lib/operation-history-storage';
import ExchangeBalances from './ExchangeBalances';
import ConfirmOrderModal from './ConfirmOrderModal';
import { useInitDataOptimized } from './useInitDataOptimized';
import { getMonitoredPairs } from '@/lib/predefined-pairs';
import { useSoundAlerts } from './useSoundAlerts';
import { usePositionPnLAlerts } from './usePositionPnLAlerts';
import PositionPnLAlert from './PositionPnLAlert';

const EXCHANGES = [
  { value: "gateio", label: "Gate.io" },
  { value: "mexc", label: "MEXC" },
];

// Lista pré-definida de pares (substitui carregamento dinâmico)
const DEFAULT_PAIRS = getMonitoredPairs().map(pair => pair.replace('_', '/'));

// Lista fixa para Big Arb com os pares especificados
const BIG_ARB_PAIRS = [
  "BTC_USDT", "ETH_USDT", "SOL_USDT", "BNB_USDT", "XRP_USDT",
  "LINK_USDT", "AAVE_USDT", "APT_USDT", "SUI_USDT", "NEAR_USDT", "ONDO_USDT"
];

interface OpportunityFromAPI { // Interface para dados crus da API (intra-exchange)
  symbol: string;
  spotPrice: string;
  futuresPrice: string;
  direction: 'FUTURES_TO_SPOT' | 'SPOT_TO_FUTURES';
  fundingRate: string;
  percentDiff: string; // Isso é o spread bruto da API
}

interface InterExchangeOpportunityFromAPI { // Interface para dados crus da API (inter-exchange)
  symbol: string; // Espera-se que seja o par completo, ex: BTC/USDT
  spotExchange: string;
  futuresExchange: string;
  spotPrice: string;
  futuresPrice: string;
  direction: 'FUTURES_TO_SPOT' | 'SPOT_TO_FUTURES';
  fundingRate: string;
  percentDiff: string;
}

// Interface para as oportunidades formatadas para a tabela
interface Opportunity {
  symbol: string;
  compraExchange: string;
  vendaExchange: string;
  compraPreco: number;
  vendaPreco: number;
  spread: number;
  status?: string;
  tipo: 'intra' | 'inter';
  directionApi?: 'FUTURES_TO_SPOT' | 'SPOT_TO_FUTURES';
  fundingRateApi?: string;
  maxSpread24h: number | null;
  buyAtMarketType: 'spot' | 'futures';
  sellAtMarketType: 'spot' | 'futures';
}

// Função auxiliar para extrair o nome base da exchange (ex: "Gate.io (Spot)" -> "gateio")
// E para mapear a direção da API do frontend para a direção do tracker
function getTrackerParams(opportunity: Opportunity): {
  symbol: string;
  exchangeBuy: string;
  exchangeSell: string;
  direction: 'spot-to-future' | 'future-to-spot';
} | null {
  const mapApiDirectionToTracker = (apiDir: 'FUTURES_TO_SPOT' | 'SPOT_TO_FUTURES'): 'spot-to-future' | 'future-to-spot' => {
    return apiDir === 'FUTURES_TO_SPOT' ? 'spot-to-future' : 'future-to-spot';
  };

  let exBuyBase = opportunity.compraExchange.toLowerCase().split(' ')[0];
  let exSellBase = opportunity.vendaExchange.toLowerCase().split(' ')[0];

  // Para intra-exchange, o spread-tracker espera o mesmo nome de exchange para buy/sell.
  // As rotas de API intra já registram com o mesmo ID de exchange (ex: gateio, gateio).
  // O frontend para intra mostra "Gate.io (Spot)" e "Gate.io (Futuros)".
  // Precisamos garantir que para o tracker, se for intra, use o nome base da exchange.
  if (opportunity.tipo === 'intra') {
    // Remove " (Spot)" ou " (Futuros)" para obter o nome base
    const baseExchangeName = opportunity.compraExchange.replace(/ \(Spot\)| \(Futuros\)/i, '').toLowerCase();
    exBuyBase = baseExchangeName;
    exSellBase = baseExchangeName;
  }

  if (!opportunity.directionApi) return null;

  return {
    symbol: opportunity.symbol,
    exchangeBuy: exBuyBase,
    exchangeSell: exSellBase,
    direction: mapApiDirectionToTracker(opportunity.directionApi),
  };
}

const POLLING_INTERVAL_MS = 5000; // Intervalo de polling: 5 segundos

// ✅ 6. A renderização deve ser otimizada com React.memo
const OpportunityRow = React.memo(({ opportunity, livePrices, formatPrice, getSpreadDisplayClass, calcularLucro, handleCadastrarPosicao, minSpread }: any) => {
    console.log('[RENDER ROW]', opportunity);
    // ✅ 4. Na renderização de cada linha da tabela, ao exibir os preços:
    const getLivePrice = (originalPrice: number, marketTypeStr: string, side: 'buy' | 'sell') => {
        const liveData = livePrices[opportunity.symbol];
        if (!liveData) return originalPrice;

        const marketType = marketTypeStr.toLowerCase().includes('spot') ? 'spot' : 'futures';
        
        if (liveData[marketType]) {
            const price = side === 'buy' ? liveData[marketType].bestAsk : liveData[marketType].bestBid;
            return price;
        }
        return originalPrice;
    };

    // TEMPORÁRIO: Usar preços originais do worker (desabilitar getLivePrice)
    const rawCompraPreco = opportunity.compraPreco;
    const rawVendaPreco = opportunity.vendaPreco;

    // CORREÇÃO FINAL: Usar os preços corretos baseado na lógica de arbitragem
    // Compra sempre no SPOT (preço mais baixo), Venda sempre no FUTURES (preço mais alto)
    const spotPrice = rawCompraPreco; // Sempre compra no spot
    const futuresPrice = rawVendaPreco; // Sempre venda no futures
    
    // Calcula o spread usando a fórmula correta: ((Futures - Spot) / Spot) × 100
    const spreadValue = new Decimal(futuresPrice)
        .minus(new Decimal(spotPrice))
        .dividedBy(new Decimal(spotPrice))
        .times(100)
        .toNumber();
    
    console.log('[SPREAD RENDER]', opportunity.symbol, spreadValue, 'Spot:', spotPrice, 'Futures:', futuresPrice, 'Compra:', opportunity.compraExchange, 'Venda:', opportunity.vendaExchange);

    // Não renderiza a linha se o spread for zero ou negativo (sem oportunidade)
    if (spreadValue <= 0) {
        console.log('[ROW OCULTA]', opportunity.symbol, `spread ${spreadValue.toFixed(3)}% <= 0 (sem oportunidade)`, opportunity);
        return null;
    }

    // Verifica se o spread atende ao mínimo configurado (apenas positivos)
    if (spreadValue < minSpread) {
        console.log('[ROW OCULTA]', opportunity.symbol, `spread ${spreadValue.toFixed(3)}% < mínimo ${minSpread}%`, opportunity);
        return null;
    }

    // Formata os preços apenas para exibição
    const displayCompraPreco = formatPrice(rawCompraPreco);
    const displayVendaPreco = formatPrice(rawVendaPreco);

    // Função para gerar URLs das exchanges
    const getExchangeUrl = (exchange: string, symbol: string, action: 'buy' | 'sell') => {
        const normalizedSymbol = symbol.replace('/', '_');
        
        if (exchange.toLowerCase().includes('gateio') || exchange.toLowerCase().includes('gate.io')) {
            return `https://www.gate.io/pt-br/trade/${normalizedSymbol}`;
        } else if (exchange.toLowerCase().includes('mexc')) {
            // Para MEXC, usar futures se for venda (futures) ou spot se for compra (spot)
            if (action === 'sell' && opportunity.sellAtMarketType === 'futures') {
                return `https://futures.mexc.com/pt-PT/exchange/${normalizedSymbol}`;
            } else {
                return `https://www.mexc.com/pt-BR/exchange/${normalizedSymbol}`;
            }
        }
        return '#';
    };

    return (
        <tr className="border-b border-gray-700 hover:bg-gray-800">
            <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold">{opportunity.symbol}</td>
            <td className="py-4 px-6 whitespace-nowrap text-sm">
                {opportunity.compraExchange} <br /> 
                <span className="font-bold">{displayCompraPreco}</span>
                <br />
                <a 
                    href={getExchangeUrl(opportunity.compraExchange, opportunity.symbol, 'buy')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-colors"
                >
                    Comprar
                </a>
            </td>
            <td className="py-4 px-6 whitespace-nowrap text-sm">
                {opportunity.vendaExchange} <br /> 
                <span className="font-bold">{displayVendaPreco}</span>
                <br />
                <a 
                    href={getExchangeUrl(opportunity.vendaExchange, opportunity.symbol, 'sell')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
                >
                    Vender
                </a>
            </td>
            <td className={`py-4 px-6 whitespace-nowrap text-sm font-bold ${getSpreadDisplayClass(spreadValue)}`}>
              {spreadValue > 0 ? '+' : ''}{new Decimal(spreadValue).toFixed(2)}%
            </td>
            <td className="py-4 px-6 whitespace-nowrap text-sm">
              <InstantMaxSpreadCell symbol={opportunity.symbol.includes('_') ? opportunity.symbol : `${opportunity.symbol}_USDT`} currentSpread={spreadValue} />
            </td>
            <td className="py-4 px-6 whitespace-nowrap text-center text-sm">
              <button 
                onClick={() => handleCadastrarPosicao(opportunity)}
                className="flex items-center justify-center bg-custom-cyan hover:bg-custom-cyan/90 text-black font-bold py-2 px-3 rounded-md transition-colors text-sm gap-1"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Cadastrar</span>
              </button>
            </td>
        </tr>
    );
});
OpportunityRow.displayName = 'OpportunityRow';

// Nova interface para posições
interface Position {
  id: string;
  symbol: string;
  quantity: number;
  spotEntry: number;
  futuresEntry: number;
  spotExchange: string;
  futuresExchange: string;
  isSimulated?: boolean; // Campo opcional para compatibilidade
  createdAt: Date | string; // Pode vir como string do banco de dados
}

// Função para normalizar o nome da exchange
function normalizeExchangeName(name: string) {
  return name
    .toLowerCase()
    .replace(' (spot)', '')
    .replace(' (futuros)', '')
    .replace(/\./g, '') // remove pontos
    .replace(/\s/g, '') // remove espaços
    .trim();
}

interface ArbitrageTableProps {
  isBigArb?: boolean;
}

// Função utilitária para normalizar símbolo conforme exchange e tipo de mercado
function getExchangeSymbol(symbol: string, exchange: string, marketType: 'spot' | 'futures') {
  if (marketType === 'spot') {
    // Spot normalmente usa barra
    return symbol.replace('_', '/');
  }
  // Futures
  let base = symbol.replace('/', '_');
  if (exchange === 'gateio' && !base.endsWith(':USDT')) {
    base += ':USDT';
  }
  // Para MEXC, não adiciona :USDT
  return base;
}

// Adicionar declaração global para evitar erro de tipo do window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    Spread24hChart_localCache?: any;
    PriceComparisonChart_localCache?: any;
  }
}

export default function ArbitrageTable({ isBigArb = false }: ArbitrageTableProps) {
  console.log('[ArbitrageTable] Componente sendo renderizado');
  const [arbitrageType, setArbitrageType] = useState<'intra'|'inter'>('inter');
  const [direction, setDirection] = useState<'SPOT_TO_FUTURES' | 'FUTURES_TO_SPOT' | 'ALL'>('ALL');
  const [minSpread, setMinSpread] = useState(0.01); // Reduzido para 0.01% para capturar mais oportunidades
  const [amount, setAmount] = useState(100);
  const [spotExchange, setSpotExchange] = useState('gateio');
  const [futuresExchange, setFuturesExchange] = useState('mexc');
  const [isPaused, setIsPaused] = useState(false); // Inicia ativo para receber oportunidades
  
  // DESABILITADO: Pré-carregar dados dos gráficos
  // usePreloadCharts();

  // Estados para posições com persistência no banco de dados
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  
  // Estados para o modal de cadastro de posição
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    quantity: 0,
    spotEntry: 0,
    futuresEntry: 0,
    spotExchange: 'gateio',
    futuresExchange: 'mexc'
  });

  // Estados para o modal de confirmação de ordem
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<{
    symbol: string;
    quantity: number;
    spotExchange: string;
    futuresExchange: string;
    spotPrice: number;
    futuresPrice: number;
    spread: number;
    estimatedProfit: number;
  } | null>(null);

  // Adicionar estado para quantidade máxima de oportunidades
  const [maxOpportunities, setMaxOpportunities] = useState(10);

  // Estado para logs visuais de erro de fetch
  const [fetchErrorLog, setFetchErrorLog] = useState<string | null>(null);

  // Função utilitária para fetch com log visual
  async function fetchWithLog(url: string, options?: RequestInit) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        setFetchErrorLog(`Erro ao acessar ${url}: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Erro ao acessar ${url}: ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (err: any) {
      setFetchErrorLog(`Erro de rede ao acessar ${url}: ${err.message}`);
      throw err;
    }
  }

  // Carregar posições do banco de dados na inicialização
  useEffect(() => {
    const loadPositions = async () => {
      setIsLoadingPositions(true);
      setError(null); // Limpar erros anteriores
      
      try {
        console.log('[ArbitrageTable] Carregando posições...');
        // Usar parâmetro user_id similar à outra plataforma
        const response = await fetchWithLog('/api/positions');
        
        if (response.ok) {
          const savedPositions = await response.json();
          console.log(`[ArbitrageTable] ${savedPositions.length} posições carregadas da API`);
          setPositions(safeArray(savedPositions));
        } else {
          console.warn('[ArbitrageTable] API retornou erro, usando fallback localStorage');
          // Fallback para localStorage se a API falhar
          const localPositions = localStorage.getItem('arbitrage-positions');
          if (localPositions) {
            try {
              const parsedPositions = JSON.parse(localPositions);
              setPositions(safeArray(parsedPositions));
              console.log(`[ArbitrageTable] ${parsedPositions.length} posições carregadas do localStorage`);
            } catch (parseError) {
              console.error('[ArbitrageTable] Erro ao parsear localStorage:', parseError);
              setPositions([]);
            }
          } else {
            setPositions([]);
          }
        }
      } catch (error) {
        console.error('[ArbitrageTable] Erro de conexão:', error);
        // Fallback para localStorage se a API falhar
        const localPositions = localStorage.getItem('arbitrage-positions');
        if (localPositions) {
          try {
            const parsedPositions = JSON.parse(localPositions);
            setPositions(safeArray(parsedPositions));
            console.log(`[ArbitrageTable] ${parsedPositions.length} posições carregadas do localStorage (fallback)`);
          } catch (parseError) {
            console.error('[ArbitrageTable] Erro ao ler posições do localStorage:', parseError);
            setPositions([]);
          }
        } else {
          setPositions([]);
        }
      } finally {
        setIsLoadingPositions(false);
      }
    };

    loadPositions();
  }, []);
  

  
    // Hook de oportunidades sempre chamado, mas só conecta se enabled=true
  const { opportunities: opportunitiesRaw, livePrices } = useArbitrageWebSocket(!isPaused, maxOpportunities);
  
  // Hook de pré-carregamento de dados
  const { isLoading: isPreloading, getSpreadData, refreshData, isInitialized } = usePreloadData();
  
  console.log('[ArbitrageTable] usePreloadData status:', { isPreloading, isInitialized });
  


  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [successMessage, setSuccessMessage] = useState<string|null>(null);

  
  // Fallback seguro para oportunidades e posições
  const opportunities: any[] = safeArray<any>(opportunitiesRaw);
  const safePositions = safeArray(positions);
  
  // Debug: Log detalhado dos dados recebidos
  console.log('[ArbitrageTable] Dados do WebSocket:', {
    opportunitiesRaw,
    opportunitiesLength: opportunities.length,
    opportunitiesType: typeof opportunities,
    isArray: Array.isArray(opportunities),
    firstOpportunity: opportunities[0],
    isPaused
  });

  // Função utilitária para garantir array seguro
  function safeArray<T>(data: any): T[] {
    return Array.isArray(data) ? data : [];
  }

  // Carregar todos os dados de arbitragem de uma vez
  const { data: allData, isLoading: dataLoading, error: dataError, getMaxSpread } = useInitDataOptimized();
  
  // Hook para alertas de PnL de posições
  const { isAlertEnabled: isPnLAlertEnabled, toggleAlert: togglePnLAlert, addPosition: addPositionToAlerts } = usePositionPnLAlerts();
  
  console.log('[ArbitrageTable] Hook useInitData executado:', {
    hasData: !!allData,
    isLoading: dataLoading,
    error: dataError,
    spreads: Object.keys(allData?.spreads?.data || {}).length,
    positions: allData?.positions?.closed?.length || 0
  });

  // Teste simples para verificar se o hook está funcionando
  useEffect(() => {
    console.log('[ArbitrageTable] useEffect executado - testando hook');
    if (allData) {
      console.log('[ArbitrageTable] Dados carregados:', allData);
    }
  }, [allData]);

  // DESABILITADO: Pré-carregar dados dos gráficos para símbolos visíveis usando o novo sistema de cache
  // useEffect(() => {
  //   // Determina os símbolos visíveis na tabela
  //   const symbols = opportunities
  //     .filter(opp => {
  //       const isSpotBuyFuturesSell = opp.buyAt && opp.sellAt && opp.buyAt.marketType === 'spot' && opp.sellAt.marketType === 'futures';
  //       const spread = opp.buyAt && opp.sellAt ? ((opp.sellAt.price - opp.buyAt.price) / opp.buyAt.price) * 100 : 0;
  //       if (isBigArb) {
  //         return isSpotBuyFuturesSell && BIG_ARB_PAIRS.includes(opp.baseSymbol);
  //       }
  //       return isSpotBuyFuturesSell && spread >= minSpread;
  //     })
  //     .slice(0, maxOpportunities)
  //     .map(opp => opp.baseSymbol);

  //   if (symbols.length > 0) {
  //     console.log(`[ArbitrageTable] Pré-carregando dados para ${symbols.length} símbolos visíveis...`);
  //     // Usar setTimeout para evitar sobrecarga imediata
  //     const timeoutId = setTimeout(() => {
  //       preloadSymbols(symbols);
  //     }, 1000); // Aguardar 1 segundo antes de pré-carregar
      
  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [opportunities, isBigArb, minSpread, maxOpportunities, preloadSymbols]);


  function calcularLucro(spreadValue: number) { 
    return ((spreadValue / 100) * amount).toFixed(2);
  }
  


  const directionOptions = [
    { value: 'ALL', label: 'Todas as Direções' },
    { value: 'SPOT_TO_FUTURES', label: 'Comprar Spot / Vender Futuros (Spot < Futuros)' },
    { value: 'FUTURES_TO_SPOT', label: 'Vender Spot / Comprar Futuros (Spot > Futuros)' },
  ];
  
  const formatPrice = (price: number) => {
    try {
      const decimalPrice = new Decimal(price);
      
      if (decimalPrice.isZero()) return '0.00';
      
      // Para preços menores que 1, mantém mais casas decimais
      if (decimalPrice.abs().lessThan(1)) {
        return decimalPrice.toFixed(8).replace(/\.?0+$/, '');
      }
      
      // Para preços maiores que 1, usa 2 casas decimais
      return decimalPrice.toFixed(2);
    } catch (error) {
      console.error('Erro ao formatar preço:', error);
      return '0.00';
    }
  };

  const getSpreadDisplayClass = (spreadValue: number): string => {
    // Todos os spreads aqui já são positivos
    if (spreadValue > 1) {
      return 'text-green-400 font-bold'; // Spread alto - muito lucrativo
    } else if (spreadValue > 0.5) {
      return 'text-green-400'; // Spread médio - lucrativo
    } else {
      return 'text-yellow-400'; // Spread baixo - pouco lucrativo
    }
  };

  // Função para remover posição
  const handleRemovePosition = async (positionId: string) => {
    try {
      const response = await fetch(`/api/positions?id=${positionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPositions(prev => prev.filter(p => p.id !== positionId));
        setSuccessMessage('Posição removida com sucesso!');
      } else {
        // Fallback para remoção local
        setPositions(prev => prev.filter(p => p.id !== positionId));
        const updatedPositions = positions.filter(p => p.id !== positionId);
        localStorage.setItem('arbitrage-positions', JSON.stringify(updatedPositions));
        setSuccessMessage('Posição removida localmente!');
      }
    } catch (error) {
      console.error('Erro ao remover posição:', error);
      // Fallback para remoção local
      setPositions(prev => prev.filter(p => p.id !== positionId));
      const updatedPositions = positions.filter(p => p.id !== positionId);
      localStorage.setItem('arbitrage-positions', JSON.stringify(updatedPositions));
      setSuccessMessage('Posição removida localmente!');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Estados para o modal de finalização
  const [isFinalizationModalOpen, setIsFinalizationModalOpen] = useState(false);
  const [positionToFinalize, setPositionToFinalize] = useState<Position | null>(null);

  // Função para abrir modal de finalização
  const handleFinalizePosition = async (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (position) {
      setPositionToFinalize(position);
      setIsFinalizationModalOpen(true);
    }
  };

  // Função para processar a finalização com execução de ordens de fechamento
  const handleFinalizationSubmit = async (exitData: { spotExitPrice: number; futuresExitPrice: number }) => {
    if (!positionToFinalize) return;

    try {
      // Se for simulada, não executa ordens reais
      if (positionToFinalize.isSimulated) {
        // Calcular PnL com preços informados
        const spotPnL = (exitData.spotExitPrice - positionToFinalize.spotEntry) * positionToFinalize.quantity;
        const futuresPnL = (positionToFinalize.futuresEntry - exitData.futuresExitPrice) * positionToFinalize.quantity;
        const totalPnL = spotPnL + futuresPnL;
        const spotPnLPercent = positionToFinalize.spotEntry > 0 ? ((exitData.spotExitPrice - positionToFinalize.spotEntry) / positionToFinalize.spotEntry) * 100 : 0;
        const futuresPnLPercent = positionToFinalize.futuresEntry > 0 ? ((positionToFinalize.futuresEntry - exitData.futuresExitPrice) / positionToFinalize.futuresEntry) * 100 : 0;
        const percentPnL = spotPnLPercent + futuresPnLPercent;

        const historyData = {
          symbol: positionToFinalize.symbol,
          quantity: positionToFinalize.quantity,
          spotEntryPrice: positionToFinalize.spotEntry,
          futuresEntryPrice: positionToFinalize.futuresEntry,
          spotExitPrice: exitData.spotExitPrice,
          futuresExitPrice: exitData.futuresExitPrice,
          spotExchange: positionToFinalize.spotExchange,
          futuresExchange: positionToFinalize.futuresExchange,
          profitLossUsd: totalPnL,
          profitLossPercent: percentPnL,
          createdAt: positionToFinalize.createdAt,
          isSimulated: true
        };

        // Salvar no localStorage como backup/fallback
        const operationForStorage = {
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...historyData,
          createdAt: typeof historyData.createdAt === 'string' ? historyData.createdAt : new Date(historyData.createdAt).toISOString(),
          finalizedAt: new Date().toISOString()
        };
        OperationHistoryStorage.saveOperation(operationForStorage);

        // Tentar salvar no banco também
        try {
          await fetchWithLog('/api/operation-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyData)
          });
        } catch {}

        await handleRemovePosition(positionToFinalize.id);
        setSuccessMessage(`✅ Posição simulada ${positionToFinalize.symbol} fechada! PnL: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`);
        setTimeout(() => setSuccessMessage(null), 8000);
        setIsFinalizationModalOpen(false);
        setPositionToFinalize(null);
        return;
      }

      console.log('🔄 Iniciando fechamento de posição com ordens reais...');
      
      // 1. Preparar ordens de fechamento (operações contrárias à abertura)
      const closeOrders = [
        {
          exchange: positionToFinalize.spotExchange as 'gateio' | 'mexc',
          symbol: getExchangeSymbol(positionToFinalize.symbol, positionToFinalize.spotExchange, 'spot'),
          side: 'sell' as const, // Vender o que foi comprado no spot
          amount: positionToFinalize.quantity,
          type: 'market' as const,
          marketType: 'spot' as const
        },
        {
          exchange: positionToFinalize.futuresExchange as 'gateio' | 'mexc',
          symbol: getExchangeSymbol(positionToFinalize.symbol, positionToFinalize.futuresExchange, 'futures'),
          side: 'buy' as const, // Comprar para fechar o short em futures
          amount: positionToFinalize.quantity,
          type: 'market' as const,
          marketType: 'futures' as const
        }
      ];

      console.log('📋 Ordens de fechamento preparadas:', closeOrders);

      // 2. Executar ordens de fechamento
      const orderResponse = await fetchWithLog('/api/trading/execute-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: closeOrders }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Falha na execução das ordens de fechamento');
      }

      console.log('✅ Ordens de fechamento executadas:', orderResult.results);

      // 3. Usar preços reais de execução para cálculos
      const spotCloseResult = orderResult.results[0];
      const futuresCloseResult = orderResult.results[1];
      
      const realSpotExitPrice = spotCloseResult.price || exitData.spotExitPrice;
      const realFuturesExitPrice = futuresCloseResult.price || exitData.futuresExitPrice;

      // 4. Calcular PnL com preços reais
      // PnL Spot: venda do ativo comprado
      const spotPnL = (realSpotExitPrice - positionToFinalize.spotEntry) * positionToFinalize.quantity;
      
      // PnL Futures: recompra do ativo vendido (posição short)
      const futuresPnL = (positionToFinalize.futuresEntry - realFuturesExitPrice) * positionToFinalize.quantity;
      
      // PnL Total
      const totalPnL = spotPnL + futuresPnL;

      // Cálculo do PnL percentual para referência
      const spotPnLPercent = positionToFinalize.spotEntry > 0 ? ((realSpotExitPrice - positionToFinalize.spotEntry) / positionToFinalize.spotEntry) * 100 : 0;
      const futuresPnLPercent = positionToFinalize.futuresEntry > 0 ? ((positionToFinalize.futuresEntry - realFuturesExitPrice) / positionToFinalize.futuresEntry) * 100 : 0;
      const percentPnL = spotPnLPercent + futuresPnLPercent;

      // 5. Salvar no histórico com dados reais
      const historyData = {
        symbol: positionToFinalize.symbol,
        quantity: positionToFinalize.quantity,
        spotEntryPrice: positionToFinalize.spotEntry,
        futuresEntryPrice: positionToFinalize.futuresEntry,
        spotExitPrice: realSpotExitPrice,
        futuresExitPrice: realFuturesExitPrice,
        spotExchange: positionToFinalize.spotExchange,
        futuresExchange: positionToFinalize.futuresExchange,
        profitLossUsd: totalPnL,
        profitLossPercent: percentPnL,
        createdAt: positionToFinalize.createdAt
      };

      // Salvar no localStorage como backup/fallback
      const operationForStorage = {
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...historyData,
        createdAt: typeof historyData.createdAt === 'string' ? historyData.createdAt : new Date(historyData.createdAt).toISOString(),
        finalizedAt: new Date().toISOString()
      };

      OperationHistoryStorage.saveOperation(operationForStorage);

      // Tentar salvar no banco também
      try {
        console.log('📊 Salvando no histórico (API):', historyData);
        const historyResponse = await fetchWithLog('/api/operation-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(historyData)
        });

        if (historyResponse.ok) {
          const savedHistory = await historyResponse.json();
          console.log('✅ Histórico salvo na API com sucesso:', savedHistory);
        } else {
          const errorData = await historyResponse.json();
          console.error('❌ Erro ao salvar no histórico (resposta):', errorData);
        }
      } catch (error) {
        console.error('❌ Erro ao salvar no histórico (network):', error);
        // Continua - já temos backup no localStorage
      }

      // 6. Remover posição
      await handleRemovePosition(positionToFinalize.id);
      
      setSuccessMessage(`✅ Posição ${positionToFinalize.symbol} fechada com sucesso! 
        Spot: ${spotCloseResult.orderId} (${realSpotExitPrice.toFixed(4)})
        Futures: ${futuresCloseResult.orderId} (${realFuturesExitPrice.toFixed(4)})
        PnL: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`);
      setTimeout(() => setSuccessMessage(null), 8000);

      // Fechar modal
      setIsFinalizationModalOpen(false);
      setPositionToFinalize(null);
    } catch (error) {
      console.error('❌ Erro ao finalizar posição:', error);
      throw error; // Propaga o erro para o modal
    }
  };

  // Função para abrir o modal de cadastro com dados da oportunidade
  const handleCadastrarPosicao = (opportunity: Opportunity) => {
    console.log('🎯 handleCadastrarPosicao chamada');
    console.log('📊 opportunity:', opportunity);
    
    // Determinar exchanges baseado no tipo de oportunidade
    const spotExchange = opportunity.compraExchange.toLowerCase().includes('gate') ? 'gateio' : 'mexc';
    const futuresExchange = opportunity.vendaExchange.toLowerCase().includes('mexc') ? 'mexc' : 'gateio';
    
    console.log('🏢 Exchanges determinadas:', { spotExchange, futuresExchange });
    
    const newPos = {
      symbol: opportunity.symbol,
      quantity: 0,
      spotEntry: opportunity.compraPreco,
      futuresEntry: opportunity.vendaPreco,
      spotExchange: spotExchange,
      futuresExchange: futuresExchange
    };
    
    console.log('📋 Nova posição preparada:', newPos);
    setNewPosition(newPos);
    setIsPositionModalOpen(true);
    console.log('✅ Modal de posição aberto');
  };

  // Função para mostrar modal de confirmação
  const handleAddPosition = () => {
    console.log('🎯 handleAddPosition chamada');
    console.log('📊 newPosition:', newPosition);
    
    if (!newPosition.symbol || newPosition.spotEntry <= 0 || newPosition.futuresEntry <= 0 || newPosition.quantity <= 0) {
      console.error('❌ Campos obrigatórios não preenchidos:', {
        symbol: newPosition.symbol,
        spotEntry: newPosition.spotEntry,
        futuresEntry: newPosition.futuresEntry,
        quantity: newPosition.quantity
      });
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Calcular spread e lucro estimado
    const spread = ((newPosition.futuresEntry - newPosition.spotEntry) / newPosition.spotEntry) * 100;
    const estimatedProfit = (spread / 100) * newPosition.quantity * newPosition.spotEntry;

    console.log('📊 Cálculos:', { spread, estimatedProfit });

    // Preparar dados para o modal de confirmação
    const orderData = {
      symbol: newPosition.symbol,
      quantity: newPosition.quantity,
      spotExchange: newPosition.spotExchange,
      futuresExchange: newPosition.futuresExchange,
      spotPrice: newPosition.spotEntry,
      futuresPrice: newPosition.futuresEntry,
      spread: spread,
      estimatedProfit: estimatedProfit
    };

    console.log('📋 Dados da ordem preparados:', orderData);
    setPendingOrderData(orderData);

    setIsPositionModalOpen(false);
    setIsConfirmModalOpen(true);
    console.log('✅ Modal de confirmação aberto');
  };

  // Função para executar ordens após confirmação
  const executeOrders = async (isRealOrder: boolean) => {
    if (!pendingOrderData) {
      console.error('❌ Nenhum dado de ordem pendente encontrado');
      return;
    }

    console.log(`🚀 Iniciando abertura de posição com ordens ${isRealOrder ? 'reais' : 'simuladas'}...`);
    console.log('📊 Dados da ordem pendente:', pendingOrderData);
    
    setIsLoading(true);
    try {
      let positionData;

      if (isRealOrder) {
        // 1. Preparar ordens para execução real
        const orders = [
          {
            exchange: pendingOrderData.spotExchange as 'gateio' | 'mexc',
            symbol: pendingOrderData.symbol,
            side: 'buy' as const,
            amount: pendingOrderData.quantity,
            type: 'market' as const,
            marketType: 'spot' as const
          },
          {
            exchange: pendingOrderData.futuresExchange as 'gateio' | 'mexc',
            symbol: pendingOrderData.symbol,
            side: 'sell' as const,
            amount: pendingOrderData.quantity,
            type: 'market' as const,
            marketType: 'futures' as const
          }
        ];

        console.log('📋 Ordens preparadas:', orders);

        // 2. Executar ordens reais nas exchanges
        console.log('📡 Enviando requisição para API de trading...');
        const orderResponse = await fetchWithLog('/api/trading/execute-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orders }),
        });

        console.log('📡 Status da resposta:', orderResponse.status);
        const orderResult = await orderResponse.json();
        console.log('📡 Resultado da API:', orderResult);

        if (!orderResult.success) {
          console.error('❌ Falha na execução das ordens:', orderResult);
          throw new Error(orderResult.error || 'Falha na execução das ordens');
        }

        console.log('✅ Ordens executadas com sucesso:', orderResult.results);

        // 3. Atualizar preços com os preços reais de execução
        const spotOrderResult = orderResult.results[0];
        const futuresOrderResult = orderResult.results[1];

        positionData = {
          symbol: pendingOrderData.symbol,
          quantity: pendingOrderData.quantity,
          spotEntry: spotOrderResult.price || pendingOrderData.spotPrice,
          futuresEntry: futuresOrderResult.price || pendingOrderData.futuresPrice,
          spotExchange: pendingOrderData.spotExchange,
          futuresExchange: pendingOrderData.futuresExchange,
          isSimulated: false
        };

        setSuccessMessage(`✅ Posição REAL aberta com sucesso! 
          Spot: ${spotOrderResult.orderId} (${spotOrderResult.price?.toFixed(4)})
          Futures: ${futuresOrderResult.orderId} (${futuresOrderResult.price?.toFixed(4)})`);

      } else {
        // Ordem simulada - usar preços atuais
        console.log('🎮 Executando ordem simulada...');
        
        positionData = {
          symbol: pendingOrderData.symbol,
          quantity: pendingOrderData.quantity,
          spotEntry: pendingOrderData.spotPrice,
          futuresEntry: pendingOrderData.futuresPrice,
          spotExchange: pendingOrderData.spotExchange,
          futuresExchange: pendingOrderData.futuresExchange,
          isSimulated: true
        };

        setSuccessMessage(`✅ Posição SIMULADA criada com sucesso! 
          Spot: ${pendingOrderData.spotPrice.toFixed(4)} (${pendingOrderData.spotExchange})
          Futures: ${pendingOrderData.futuresPrice.toFixed(4)} (${pendingOrderData.futuresExchange})`);
      }

      // 4. Salvar posição no banco de dados
      const response = await fetchWithLog('/api/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(positionData),
      });

      if (response.ok) {
        const newPositionFromServer = await response.json();
        setPositions(prev => [...prev, newPositionFromServer]);
        
        // Adicionar posição ao sistema de alertas de PnL
        addPositionToAlerts(newPositionFromServer.id);
        
        // Fechar modais e resetar
        setIsConfirmModalOpen(false);
        setPendingOrderData(null);
        setNewPosition({
          symbol: '',
          quantity: 0,
          spotEntry: 0,
          futuresEntry: 0,
          spotExchange: 'gateio',
          futuresExchange: 'mexc'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar posição no banco');
      }

    } catch (error) {
      console.error('❌ Erro ao abrir posição:', error);
      setError(error instanceof Error ? error.message : 'Erro ao abrir posição');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para calcular PnL
  // Função para normalizar o símbolo (pode haver diferenças de formato)
  const normalizeSymbol = (symbol: string) => {
    // Remove espaços e converte para o formato padrão
    return symbol.replace(/\s+/g, '').toUpperCase();
  };

  // Função auxiliar para obter preços em tempo real - usando a mesma lógica da tabela
  const getLivePriceForPosition = (position: Position, marketType: 'spot' | 'futures', side: 'buy' | 'sell' = 'buy') => {
    const symbol = position.symbol;
    // Tenta diferentes formatos do símbolo, todos em uppercase
    const possibleSymbols = [
      symbol.toUpperCase(),
      symbol.replace('/', '_').toUpperCase(),
      symbol.replace('/', '').toUpperCase(),
      normalizeSymbol(symbol),
      normalizeSymbol(symbol.replace('/', '_')),
    ];

    let liveData = null;
    let foundSymbol = '';

    // Procura pelos diferentes formatos
    for (const testSymbol of possibleSymbols) {
      if (livePrices[testSymbol]) {
        liveData = livePrices[testSymbol];
        foundSymbol = testSymbol;
        break;
      }
    }
    
    if (!liveData) {
      return marketType === 'spot' ? position.spotEntry : position.futuresEntry;
    }
    
    if (liveData[marketType]) {
      const price = side === 'buy' ? liveData[marketType].bestAsk : liveData[marketType].bestBid;
      return price || (marketType === 'spot' ? position.spotEntry : position.futuresEntry);
    }
    
    return marketType === 'spot' ? position.spotEntry : position.futuresEntry;
  };

  // Função para obter preço atual de spot (para exibição)
  const getCurrentSpotPrice = (position: Position) => {
    // Para spot, queremos o preço médio (ou bestBid para mostrar preço de venda)
    return getLivePriceForPosition(position, 'spot', 'sell');
  };

  // Função para obter preço atual de futures (para exibição)
  const getCurrentFuturesPrice = (position: Position) => {
    // Para futures, queremos o preço médio (ou bestAsk para mostrar preço de compra para fechar short)
    return getLivePriceForPosition(position, 'futures', 'buy');
  };

  const calculatePnL = (position: Position) => {
    const currentSpotPrice = getCurrentSpotPrice(position);
    const currentFuturesPrice = getCurrentFuturesPrice(position);

    // Implementação das fórmulas específicas solicitadas:
    // pnlSpot = ((precoAtualSpot - precoEntradaSpot) / precoEntradaSpot) * 100
    // pnlFutures = ((precoEntradaFutures - precoAtualFutures) / precoEntradaFutures) * 100
    // pnlPercent = pnlSpot + pnlFutures
    
    const pnlSpot = position.spotEntry > 0 ? ((currentSpotPrice - position.spotEntry) / position.spotEntry) * 100 : 0;
    const pnlFutures = position.futuresEntry > 0 ? ((position.futuresEntry - currentFuturesPrice) / position.futuresEntry) * 100 : 0;
    const pnlPercent = pnlSpot + pnlFutures;

    // Calcular PnL total em valor absoluto para exibição
    const spotPnL = (currentSpotPrice - position.spotEntry) * position.quantity;
    const futuresPnL = (position.futuresEntry - currentFuturesPrice) * position.quantity;
    const totalPnL = spotPnL + futuresPnL;

    return { 
      totalPnL, 
      pnlPercent, 
      currentSpotPrice, 
      currentFuturesPrice,
      spotPnL,
      futuresPnL,
      pnlSpot,
      pnlFutures
    };
  };

  // Exibir erro global na interface se houver erro de fetch
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center text-red-400">
          <div className="mb-2">⚠️ {error}</div>
          <div className="text-sm text-gray-400">Verifique sua conexão ou tente recarregar a página.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fetchErrorLog && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999}} className="bg-red-900 text-red-200 p-3 text-center font-mono text-sm">
          <b>ERRO DE FETCH:</b> {fetchErrorLog}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            {isBigArb ? 'Big Arb - Grandes Ativos' : 'Arbitragem'}
          </h1>
          {isBigArb && (
            <p className="text-gray-400 mt-1">
              Monitoramento exclusivo de grandes ativos com alto volume de mercado
            </p>
          )}
        </div>
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${isPaused ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-red-500 text-white hover:bg-red-400'}`}
        >
          {isPaused ? 'Iniciar Busca' : 'Pausar Busca'}
        </button>
      </div>

      <div className="p-4 bg-dark-card rounded-lg shadow">
        <div className={`grid grid-cols-1 md:grid-cols-${isBigArb ? '3' : '4'} lg:grid-cols-${isBigArb ? '3' : '4'} gap-4 items-end`}>
          {!isBigArb && (
            <div>
              <label htmlFor="minSpread" className="block text-sm font-medium text-gray-300 mb-1">Spread Mínimo (%)</label>
              <input 
                id="minSpread" type="number" step="0.01" min={0} 
                className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan"
                value={minSpread}
                onChange={e => setMinSpread(Number(e.target.value.replace(',', '.')))} 
              />
            </div>
          )}
          <div>
            <label htmlFor="maxOpportunities" className="block text-sm font-medium text-gray-300 mb-1">Qtd. Máx. Oportunidades</label>
            <select
              id="maxOpportunities"
              className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan"
              value={maxOpportunities}
              onChange={e => setMaxOpportunities(Number(e.target.value))}
            >
              {[...Array(20)].map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="spotExchange" className="block text-sm font-medium text-gray-300 mb-1">Exchange Spot</label>
            <select id="spotExchange" className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan" value={spotExchange} onChange={e => setSpotExchange(e.target.value)}>
              {EXCHANGES.map(ex => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="futuresExchange" className="block text-sm font-medium text-gray-300 mb-1">Exchange Futuros</label>
            <select id="futuresExchange" className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan" value={futuresExchange} onChange={e => setFuturesExchange(e.target.value)}>
              {EXCHANGES.map(ex => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}
      {!error && successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg">
          <CheckCircle2 className="h-5 w-5" />
          <p>{successMessage}</p>
        </div>
      )}

      <div className="bg-dark-card p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Oportunidades Encontradas</h2>
        </div>
        

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Par</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Compra</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Venda</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Spread %</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Spread Máximo (24h)</th>
                <th className="py-3 px-6 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            {fetchErrorLog ? (
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td colSpan={6} className="py-4 px-6 text-center text-red-400">
                    <AlertTriangle className="h-5 w-5 inline-block mr-2" />
                    Não foi possível carregar as oportunidades. Verifique sua conexão ou tente recarregar a página.<br/>
                    <span className="text-xs text-red-300">{fetchErrorLog}</span>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-700">
                {(() => {
                  try {
                    const safeOpps = safeArray(opportunities);
                    if (!Array.isArray(safeOpps)) {
                      console.log('[ArbitrageTable] Opportunities não é um array válido:', safeOpps);
                      return null;
                    }
                    
                    // Otimização: processar apenas se houver dados
                    if (safeOpps.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-400">
                            Nenhuma oportunidade encontrada
                          </td>
                        </tr>
                      );
                    }
                    
                    const filteredOpps = (safeOpps as any[])
                      .filter((opp: any) => {
                        console.log('[ArbitrageTable] Filtrando oportunidade:', opp);
                        
                        // Validação básica da estrutura da oportunidade
                        if (!opp || typeof opp !== 'object') {
                          console.log('[ArbitrageTable] ❌ Oportunidade inválida (não é objeto)');
                          return false;
                        }
                        
                        // Verificar se tem a estrutura básica
                        if (!opp.buyAt || !opp.sellAt) {
                          console.log('[ArbitrageTable] ❌ Oportunidade sem buyAt/sellAt');
                          return false;
                        }
                        
                        // Verificar se tem preços válidos
                        if (!opp.buyAt.price || !opp.sellAt.price || opp.buyAt.price <= 0 || opp.sellAt.price <= 0) {
                          console.log('[ArbitrageTable] ❌ Oportunidade com preços inválidos:', {
                            buyPrice: opp.buyAt.price,
                            sellPrice: opp.sellAt.price
                          });
                          return false;
                        }
                        
                        const isSpotBuyFuturesSell = opp.buyAt.marketType === 'spot' && opp.sellAt.marketType === 'futures';
                        const spread = opp.profitPercentage; // Usar o spread já calculado pelo worker
                        
                        console.log('[ArbitrageTable] Análise:', {
                          isSpotBuyFuturesSell,
                          spread,
                          minSpread,
                          baseSymbol: opp.baseSymbol,
                          buyAt: opp.buyAt,
                          sellAt: opp.sellAt
                        });
                        
                        // Verificar se o spread atende ao mínimo configurado
                        const isValid = isSpotBuyFuturesSell && spread >= minSpread;
                        console.log('[ArbitrageTable] Resultado:', { isValid, spread, minSpread });
                        return isValid;
                      })
                      .sort((a: any, b: any) => {
                        const spreadA = a.profitPercentage || 0;
                        const spreadB = b.profitPercentage || 0;
                        return spreadB - spreadA;
                      })
                      .slice(0, maxOpportunities);
                    
                    console.log('[ArbitrageTable] Oportunidades filtradas:', filteredOpps.length);
                    
                    return filteredOpps.map((opp: any) => {
                        const symbol = opp.baseSymbol;
                        console.log('[ArbitrageTable] Processando oportunidade:', { 
                          symbol, 
                          baseSymbol: opp.baseSymbol,
                          formattedSymbol: symbol.replace('/', '_'),
                          isSpotBuyFuturesSell: opp.buyAt.marketType === 'spot' && opp.sellAt.marketType === 'futures',
                          hasBuyAt: !!opp.buyAt,
                          hasSellAt: !!opp.sellAt
                        });
                        return (
                        <OpportunityRow
                          key={`${opp.baseSymbol}-${opp.buyAt.exchange}-${opp.sellAt.exchange}`}
                          opportunity={{
                            symbol: opp.baseSymbol,
                            compraExchange: opp.buyAt.exchange,
                            compraPreco: opp.buyAt.price,
                            vendaExchange: opp.sellAt.exchange,
                            vendaPreco: opp.sellAt.price,
                            spread: opp.profitPercentage,
                            tipo: 'inter',
                            directionApi: opp.arbitrageType && opp.arbitrageType.includes('spot_to_futures') ? 'SPOT_TO_FUTURES' : 'FUTURES_TO_SPOT',
                            maxSpread24h: null,
                            buyAtMarketType: opp.buyAt.marketType,
                            sellAtMarketType: opp.sellAt.marketType,
                          }}
                          livePrices={livePrices}
                          formatPrice={formatPrice}
                          getSpreadDisplayClass={getSpreadDisplayClass}
                          calcularLucro={calcularLucro}
                          handleCadastrarPosicao={handleCadastrarPosicao}
                          minSpread={minSpread}
                        />
                      );
                    });
                  } catch (err) {
                    console.error('Erro inesperado ao renderizar oportunidades:', err);
                    return (
                      <tr>
                        <td colSpan={6} className="py-4 px-6 text-center text-red-400">
                          <AlertTriangle className="h-5 w-5 inline-block mr-2" />
                          Erro inesperado ao renderizar oportunidades.<br/>
                          <span className="text-xs text-red-300">{String(err)}</span>
                        </td>
                      </tr>
                    );
                  }
                })()}
              </tbody>
            )}
          </table>
        </div>
      </div>



      {/* Seção de Posições Abertas */}
      {(safePositions.length > 0 || isLoadingPositions) && (
        <div className="bg-dark-card p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Posições Abertas</h2>
          </div>

          {isLoadingPositions ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span className="text-gray-400">Carregando posições...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(safePositions as Position[]).map((position: Position) => {
              // Usar preços em tempo real do livePrices
              const currentSpotPrice = getLivePriceForPosition(position, 'spot', 'sell');
              const currentFuturesPrice = getLivePriceForPosition(position, 'futures', 'buy');
              // Recalcular PnL e spreads em tempo real
              const spotPnL = (currentSpotPrice - position.spotEntry) * position.quantity;
              const futuresPnL = (position.futuresEntry - currentFuturesPrice) * position.quantity;
              const totalPnL = spotPnL + futuresPnL;
              const pnlSpot = position.spotEntry > 0 ? ((currentSpotPrice - position.spotEntry) / position.spotEntry) * 100 : 0;
              const pnlFutures = position.futuresEntry > 0 ? ((position.futuresEntry - currentFuturesPrice) / position.futuresEntry) * 100 : 0;
              const pnlPercent = pnlSpot + pnlFutures;
              const entrySpread = ((position.futuresEntry - position.spotEntry) / position.spotEntry) * 100;
              const currentSpread = ((currentFuturesPrice - currentSpotPrice) / currentSpotPrice) * 100;

                              // Função para mapear exchange para nome de exibição
                const getExchangeDisplayName = (exchange: string) => {
                  const exchangeMap: { [key: string]: string } = {
                    'gateio': 'Gate.io',
                    'mexc': 'MEXC'
                  };
                  return exchangeMap[exchange] || exchange;
                };

                return (
                <div key={position.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 relative">
                  {/* Header com símbolo, quantidade e botões */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{position.symbol}</h3>
                        {position.isSimulated ? (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            SIMULADA
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                            REAL
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-custom-cyan font-medium">
                        {position.quantity.toFixed(3)} {position.symbol.split('/')[0]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Alerta de PnL */}
                      <PositionPnLAlert
                        symbol={position.symbol}
                        pnlPercent={pnlPercent}
                        totalPnL={totalPnL}
                        isEnabled={isPnLAlertEnabled(position.id)}
                        onToggle={(enabled) => togglePnLAlert(position.id, enabled)}
                      />
                      {/* Botão de remover */}
                      <button
                        onClick={() => handleRemovePosition(position.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Estratégia - Spot vs Futures */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                    <div className="bg-gray-700/50 p-2 rounded">
                      <p className="text-gray-400 mb-1">SPOT ({getExchangeDisplayName(position.spotExchange)})</p>
                      <p className="text-white font-medium">Entrada: {formatPrice(position.spotEntry)}</p>
                      <p className="text-gray-300">Atual: {formatPrice(currentSpotPrice)}</p>
                      <p className={`text-xs font-medium ${spotPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        P&L: {spotPnL >= 0 ? '+' : ''}${spotPnL.toFixed(2)} ({pnlSpot >= 0 ? '+' : ''}{pnlSpot.toFixed(2)}%)
                      </p>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded">
                      <p className="text-gray-400 mb-1">FUTURES ({getExchangeDisplayName(position.futuresExchange)})</p>
                      <p className="text-white font-medium">Entrada: {formatPrice(position.futuresEntry)}</p>
                      <p className="text-gray-300">Atual: {formatPrice(currentFuturesPrice)}</p>
                      <p className={`text-xs font-medium ${futuresPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        P&L: {futuresPnL >= 0 ? '+' : ''}${futuresPnL.toFixed(2)} ({pnlFutures >= 0 ? '+' : ''}{pnlFutures.toFixed(2)}%)
                      </p>
                    </div>
                  </div>

                  {/* Spread e Performance */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Spread Entrada</p>
                      <p className={`text-sm font-bold ${entrySpread >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entrySpread.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Spread Atual</p>
                      <p className={`text-sm font-bold ${currentSpread >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {currentSpread.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* PnL Destacado */}
                  <div className="bg-gray-700/30 p-3 rounded mb-3">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">P&L Total</p>
                        <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">P&L %</p>
                        <p className={`text-lg font-bold ${pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <a 
                      href={`https://www.gate.io/pt-br/trade/${position.symbol.replace('/', '_')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-colors text-center"
                    >
                      Comprar Spot
                    </a>
                    <a 
                      href={`https://futures.mexc.com/pt-PT/exchange/${position.symbol.replace('/', '_')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors text-center"
                    >
                      Vender Futures
                    </a>
                  </div>
                  
                  {/* Botão Finalizar */}
                  <button
                    onClick={() => handleFinalizePosition(position.id)}
                    className="w-full py-2 bg-custom-cyan hover:bg-custom-cyan/90 text-black font-bold rounded transition-colors text-sm"
                  >
                    Finalizar Posição
                  </button>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Cadastro de Posição */}
      <Dialog open={isPositionModalOpen} onOpenChange={setIsPositionModalOpen}>
        <DialogContent className="max-w-2xl bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Cadastro de Posição</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Posição Spot */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Posição Spot</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Exchange</label>
                  <select
                    value={newPosition.spotExchange}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, spotExchange: e.target.value }))}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan"
                  >
                    {EXCHANGES.map(ex => (
                      <option key={ex.value} value={ex.value}>{ex.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Símbolo</label>
                  <input
                    type="text"
                    value={newPosition.symbol}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, symbol: e.target.value }))}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan"
                    placeholder="Ex: BTC/USDT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preço de Entrada</label>
                  <input
                    type="number"
                    step="0.00000001"
                    min="0"
                    value={newPosition.spotEntry}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, spotEntry: Number(e.target.value) }))}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan"
                    placeholder="Preço de entrada spot"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={newPosition.quantity}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan"
                    placeholder="Quantidade a operar"
                  />
                </div>
              </div>
            </div>

            {/* Posição Futures */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Posição Futures</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Exchange</label>
                  <select
                    value={newPosition.futuresExchange}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, futuresExchange: e.target.value }))}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan"
                  >
                    {EXCHANGES.map(ex => (
                      <option key={ex.value} value={ex.value}>{ex.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Símbolo</label>
                  <input
                    type="text"
                    value={newPosition.symbol}
                    disabled
                    className="w-full bg-gray-600 border-gray-600 text-gray-400 rounded-md p-2 cursor-not-allowed"
                    placeholder="Mesmo símbolo do spot"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preço de Entrada</label>
                  <input
                    type="number"
                    step="0.00000001"
                    min="0"
                    value={newPosition.futuresEntry}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, futuresEntry: Number(e.target.value) }))}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-custom-cyan focus:border-custom-cyan"
                    placeholder="Preço de entrada futures"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
                  <input
                    type="number"
                    value={newPosition.quantity}
                    disabled
                    className="w-full bg-gray-600 border-gray-600 text-gray-400 rounded-md p-2 cursor-not-allowed"
                    placeholder="Mesma quantidade do spot"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsPositionModalOpen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPosition}
                disabled={isLoading}
                className="px-4 py-2 bg-custom-cyan hover:bg-custom-cyan/90 text-black font-bold rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar Posição'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Finalização de Posição */}
      <FinalizePositionModal
        isOpen={isFinalizationModalOpen}
        onClose={() => {
          setIsFinalizationModalOpen(false);
          setPositionToFinalize(null);
        }}
        position={positionToFinalize}
        currentSpotPrice={positionToFinalize ? getCurrentSpotPrice(positionToFinalize) : 0}
        currentFuturesPrice={positionToFinalize ? getCurrentFuturesPrice(positionToFinalize) : 0}
        onFinalize={handleFinalizationSubmit}
      />

      {/* Modal de Confirmação de Ordem */}
      <ConfirmOrderModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setPendingOrderData(null);
        }}
        onConfirm={executeOrders}
        orderData={pendingOrderData}
        isLoading={isLoading}
      />
    </div>
  );
} 