import { NextResponse } from 'next/server';
// import ccxt, { Exchange } from 'ccxt'; // Comentado - não usado se a lógica for desabilitada
// import { SUPPORTED_SYMBOLS } from '@/lib/constants'; // Comentado
// import { findTradableSymbol, SupportedExchangeId } from '@/lib/exchangeUtils'; // Comentado

// Helper para validar se a string é uma SupportedExchangeId
// function isValidSupportedExchangeId(id: string): id is SupportedExchangeId { // Comentado
//   return ['binance', 'bybit', 'gateio', 'mexc'].includes(id);
// }

// Helper para obter uma instância da CCXT de forma segura
// function getCcxtInstance(exchangeId: SupportedExchangeId): Exchange | null { // Comentado
//   if (!ccxt.exchanges.includes(exchangeId)) {
//     console.error(`All-Opps: CCXT exchange ID '${exchangeId}' não é válida ou disponível.`);
//     return null;
//   }
//   const ExchangeConstructor = ccxt[exchangeId as keyof typeof ccxt] as typeof Exchange;
//   if (typeof ExchangeConstructor !== 'function') {
//     console.error(`All-Opps: Construtor CCXT não encontrado para ID: ${exchangeId}`);
//     return null;
//   }
//   return new ExchangeConstructor({ enableRateLimit: true });
// }

// const ALL_EXCHANGES: SupportedExchangeId[] = ['binance', 'bybit', 'gateio', 'mexc']; // Comentado

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.warn('Aviso: Não foi possível conectar ao banco de dados');
}

export async function GET(req: Request) {
  try {
    console.log("API /api/arbitrage/all-opportunities chamada");
    
    if (!prisma) {
      console.warn('Aviso: Banco de dados não disponível');
      return NextResponse.json([]);
    }

    // Buscar oportunidades das últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const opportunities = await prisma.spreadHistory.findMany({
      where: {
        timestamp: {
          gte: twentyFourHoursAgo,
        },
        spread: {
          gt: 0.1 // Apenas spreads > 0.1%
        }
      },
      select: {
        id: true,
        symbol: true,
        spread: true,
        exchangeBuy: true,
        exchangeSell: true,
        direction: true,
        spotPrice: true,
        futuresPrice: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100 // Limitar a 100 oportunidades
    });

    console.log(`[API] Encontradas ${opportunities.length} oportunidades`);

    // Formatar dados para o frontend
    const formattedOpportunities = opportunities.map(opp => ({
      id: opp.id,
      baseSymbol: opp.symbol,
      profitPercentage: opp.spread,
      buyAt: {
        exchange: opp.exchangeBuy,
        price: opp.spotPrice,
        marketType: 'spot'
      },
      sellAt: {
        exchange: opp.exchangeSell,
        price: opp.futuresPrice,
        marketType: 'futures'
      },
      arbitrageType: opp.direction,
      timestamp: opp.timestamp.getTime()
    }));

    return NextResponse.json(formattedOpportunities);

  } catch (error) {
    console.error('All-Opps - Erro:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 