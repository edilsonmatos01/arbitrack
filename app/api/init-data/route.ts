import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Cache em memória para melhorar performance
const initDataCache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 segundos

export async function GET(req: NextRequest) {
  console.log('[API] GET /api/init-data - Iniciando...');
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || 'edilsonmatos';
    const cacheKey = `init-data_${userId}`;

    console.log('[API] Parâmetros:', { userId });

    // Verificar cache primeiro
    const cached = initDataCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('[API] Retornando dados do cache');
      return NextResponse.json(cached.data);
    }

    // Se não há prisma, retornar dados mockados
    if (!prisma) {
      console.warn('[API] Banco de dados não disponível, retornando dados mockados');
      const mockData = {
        positions: {
          open: [],
          closed: [
            {
              _id: 'pos_mock_1',
              userId: userId,
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
              notes: 'Simulada',
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
      initDataCache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Timeout para evitar travamentos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });

    // Buscar dados em paralelo
    const dataPromise = Promise.all([
      // Buscar posições
      prisma.position.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50, // Limitar para performance
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
      }),
      // Buscar spreads máximos das últimas 24h
      prisma.$queryRaw`
        SELECT 
          symbol,
          MAX(spread) as spMax,
          MIN(spread) as spMin,
          COUNT(*) as crosses,
          ARRAY_AGG(DISTINCT exchangeBuy || '_' || exchangeSell) as exchanges
        FROM "SpreadHistory" 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY symbol
        ORDER BY spMax DESC
        LIMIT 100
      `
    ]);

    const [positions, spreadsRaw] = await Promise.race([dataPromise, timeoutPromise]) as [any[], any[]];

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
    spreadsRaw.forEach((spread: any) => {
      const symbol = spread.symbol.replace('/', '_');
      spreadsData[symbol] = {
        spMax: parseFloat(spread.spmax) || 0,
        spMin: parseFloat(spread.spmin) || 0,
        crosses: parseInt(spread.crosses) || 0,
        exchanges: spread.exchanges || []
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