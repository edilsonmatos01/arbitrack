import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

// Cache em memória para melhorar performance
const initDataCache = new Map();
const CACHE_DURATION = 60 * 1000; // 1 minuto

export async function GET(req: NextRequest) {
  console.log('[API] GET /api/init-data - Iniciando...');
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || 'edilsonmatos';
    const cacheKey = `init-data_${userId}`;

    console.log('[API] Parâmetros:', { userId });
    console.log('[API] Prisma disponível:', !!prisma);

    // Verificar cache primeiro
    const cached = initDataCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('[API] Retornando dados do cache');
      return NextResponse.json(cached.data);
    }

    // Forçar uso do banco real
    console.log('[API] Tentando conectar com o banco de dados...');

    if (!prisma) {
      throw new Error('Prisma client não disponível');
    }

    console.log('[API] Iniciando consultas ao banco...');
    const startTime = Date.now();

    // Buscar dados em paralelo - REMOVIDO TIMEOUT
    console.log('[API] Iniciando consulta de posições...');
    const positions = await prisma.position.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        symbol: true,
        quantity: true,
        spotEntry: true,
        futuresEntry: true,
        spotExchange: true,
        futuresExchange: true,
        isSimulated: true,
        createdAt: true,
        updatedAt: true
      }
    });
    console.log('[API] Posições carregadas:', positions.length);

    console.log('[API] Iniciando consulta de spreads...');
    const spreadsRaw = await prisma.spreadHistory.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      select: {
        symbol: true,
        spread: true,
        exchangeBuy: true,
        exchangeSell: true
      },
      take: 10000, // Limitar a 10.000 registros para evitar timeout
      orderBy: {
        timestamp: 'desc'
      }
    });
    console.log('[API] Spreads carregados:', spreadsRaw.length);

    const endTime = Date.now();
    console.log(`[API] Consultas concluídas em ${endTime - startTime}ms`);
    console.log(`[API] Posições encontradas: ${positions.length}`);
    console.log(`[API] Spreads encontrados: ${spreadsRaw.length}`);

    // Processar posições
    const openPositions: any[] = [];
    const closedPositions: any[] = [];

    // Por enquanto, todas as posições são consideradas "fechadas" (não temos campo de status)
    positions.forEach(pos => {
      const positionData = {
        _id: pos.id,
        userId: userId,
        asset: pos.symbol.replace('/', '_'),
        market: 'spot', // Simplificado
        side: 'buy',
        exchange: pos.spotExchange,
        amount: pos.quantity,
        entryPrice: pos.spotEntry,
        entryAt: pos.createdAt,
        exitPrice: pos.futuresEntry,
        exitAt: pos.updatedAt,
        status: 'closed',
        pnl: 0, // Calcular se necessário
        linkedTo: null,
        group: '2025T3',
        notes: pos.isSimulated ? 'Simulada' : '',
        finalizedTogether: true
      };
      closedPositions.push(positionData);
    });

    // Processar spreads
    const spreadsData: any = {};
    const spreadsBySymbol: any = {};
    
    console.log('[API] Processando spreads...');
    
    // Agrupar spreads por símbolo
    spreadsRaw.forEach((spread: any) => {
      const symbol = spread.symbol.replace('/', '_');
      if (!spreadsBySymbol[symbol]) {
        spreadsBySymbol[symbol] = [];
      }
      spreadsBySymbol[symbol].push(spread);
    });
    
    console.log(`[API] Símbolos únicos encontrados: ${Object.keys(spreadsBySymbol).length}`);
    
    // Calcular máximos e mínimos por símbolo
    Object.entries(spreadsBySymbol).forEach(([symbol, spreads]: [string, any]) => {
      const spreadsList = spreads.map((s: any) => s.spread);
      const exchanges = [...new Set(spreads.map((s: any) => `${s.exchangeBuy}_${s.exchangeSell}`))];
      
      spreadsData[symbol] = {
        spMax: Math.max(...spreadsList),
        spMin: Math.min(...spreadsList),
        crosses: spreads.length,
        exchanges
      };
    });

    // Pares por exchange (mockados por enquanto)
    const pairs = {
      gateio: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
      mexc: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
      bitget: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT']
    };

    const responseData = {
      positions: {
        open: openPositions,
        closed: closedPositions
      },
      spreads: {
        data: spreadsData
      },
      pairs
    };

    // Armazenar no cache
    initDataCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    console.log(`[API] Dados carregados: ${closedPositions.length} posições, ${Object.keys(spreadsData).length} spreads`);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[API] Erro ao carregar dados:', error);
    
    // Retornar dados mockados em caso de erro
    const mockData = {
      positions: {
        open: [],
        closed: [
          {
            _id: 'pos_error_1',
            userId: 'edilsonmatos',
            asset: 'BTC_USDT',
            market: 'spot',
            side: 'buy',
            exchange: 'gateio',
            amount: 0.1,
            entryPrice: 45000,
            entryAt: '2025-01-15T10:00:00.000Z',
            exitPrice: 45100,
            exitAt: '2025-01-15T11:00:00.000Z',
            status: 'closed',
            pnl: 10.0,
            linkedTo: null,
            group: '2025T3',
            notes: 'Dados Mockados (Erro)',
            finalizedTogether: true
          }
        ]
      },
      spreads: {
        data: {
          'BTC_USDT': {
            spMax: 2.5,
            spMin: -0.8,
            crosses: 15,
            exchanges: ['gateio_mexc', 'bitget_mexc']
          },
          'ETH_USDT': {
            spMax: 1.8,
            spMin: -1.2,
            crosses: 12,
            exchanges: ['gateio_mexc']
          },
          'SOL_USDT': {
            spMax: 3.2,
            spMin: -0.5,
            crosses: 8,
            exchanges: ['bitget_mexc']
          }
        }
      },
      pairs: {
        gateio: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
        mexc: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
        bitget: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT']
      }
    };
    return NextResponse.json(mockData);
  }
} 