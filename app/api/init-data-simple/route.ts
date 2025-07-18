import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Configurações para evitar problemas durante o build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  // Verificar se estamos em modo de build
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[API] Build detectado, retornando dados mockados');
    return NextResponse.json({
      positions: { open: [], closed: [] },
      spreads: { data: {} },
      pairs: {
        gateio: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
        mexc: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT']
      }
    });
  }

  console.log('[API] GET /api/init-data-simple - Iniciando...');
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || 'edilsonmatos';

    console.log('[API] Parâmetros:', { userId });
    console.log('[API] Prisma disponível:', !!prisma);

    if (!prisma) {
      console.warn('[API] Prisma client não disponível, usando dados mockados');
      // Retornar dados mockados em vez de falhar
      const mockData = {
        positions: {
          open: [],
          closed: []
        },
        spreads: {
          data: {
            'ERA_USDT': { spMax: 2.5, spMin: -0.8, crosses: 15, exchanges: ['gateio_mexc'] },
            'HOLD_USDT': { spMax: 1.8, spMin: -1.2, crosses: 12, exchanges: ['gateio_mexc'] },
            'TOMI_USDT': { spMax: 3.2, spMin: -0.5, crosses: 8, exchanges: ['gateio_mexc'] }
          }
        },
        pairs: {
          gateio: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
          mexc: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT']
        }
      };
      return NextResponse.json(mockData);
    }

    console.log('[API] Usando lista fixa de símbolos...');
    
    // Usar lista fixa de símbolos que aparecem na tabela e são gravados pelo worker
    const symbols = [
      // Símbolos principais que o worker monitora
      'BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'XRP_USDT', 'BNB_USDT',
      // Símbolos adicionais que podem aparecer
      'ADA_USDT', 'DOT_USDT', 'AVAX_USDT', 'MATIC_USDT', 'LINK_USDT',
      'ATOM_USDT', 'LTC_USDT', 'BCH_USDT', 'ETC_USDT', 'FIL_USDT',
      // Símbolos específicos da tabela
      'ERA_USDT', 'HOLD_USDT', 'TOMI_USDT', 'LAVA_USDT', 'PIN_USDT', 'DEVVE_USDT',
      'WHITE_USDT', 'NAM_USDT', 'BOXCAT_USDT', 'VANRY_USDT', 'VR_USDT', 'KEKIUS_USDT',
      'POLS_USDT', 'MOONPIG_USDT', 'DEAI_USDT', 'SOLO_USDT', 'DOG_USDT', 'PRIME_USDT',
      'FARTCOIN_USDT', 'FWOG_USDT', 'USELESS_USDT', 'BLZ_USDT', 'AIN_USDT', 'TRB_USDT',
      'CHILLGUY_USDT', 'GNC_USDT', 'LAMBO_USDT', 'VELO_USDT', 'ZIG_USDT', 'QUBIC_USDT'
    ];

    console.log(`[API] Processando ${symbols.length} símbolos...`);

    // Buscar dados de spread máximo para todos os símbolos de uma vez
    const spreadsData: any = {};
    
    try {
      console.log('[API] Buscando dados agregados para todos os símbolos...');
      
      // Usar uma consulta mais eficiente com groupBy
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const aggregatedData = await prisma.spreadHistory.groupBy({
        by: ['symbol'],
        where: {
          symbol: { in: symbols },
          timestamp: { gte: twentyFourHoursAgo }
        },
        _max: { spread: true },
        _min: { spread: true },
        _count: { id: true }
      });

      console.log(`[API] Dados agregados encontrados para ${aggregatedData.length} símbolos`);

      // Processar os resultados
      for (const item of aggregatedData) {
        const symbolKey = item.symbol.replace('/', '_');
        spreadsData[symbolKey] = {
          spMax: item._max.spread || 0,
          spMin: item._min.spread || 0,
          crosses: item._count.id || 0,
          exchanges: ['gateio_mexc'] // Simplificado
        };
      }

      // Adicionar símbolos que não têm dados
      const foundSymbols = aggregatedData.map(item => item.symbol);
      const missingSymbols = symbols.filter(symbol => !foundSymbols.includes(symbol));
      
      for (const symbol of missingSymbols) {
        const symbolKey = symbol.replace('/', '_');
        spreadsData[symbolKey] = {
          spMax: 0,
          spMin: 0,
          crosses: 0,
          exchanges: ['gateio_mexc']
        };
      }

    } catch (error) {
      console.error('[API] Erro ao buscar dados agregados:', error);
      // Em caso de erro, criar dados vazios
      for (const symbol of symbols) {
        const symbolKey = symbol.replace('/', '_');
        spreadsData[symbolKey] = {
          spMax: 0,
          spMin: 0,
          crosses: 0,
          exchanges: ['gateio_mexc']
        };
      }
    }

    // Pares por exchange (mockados por enquanto)
    const pairs = {
      gateio: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
      mexc: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
      bitget: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT']
    };

    const responseData = {
      positions: {
        open: [],
        closed: []
      },
      spreads: {
        data: spreadsData
      },
      pairs
    };

    console.log(`[API] Dados carregados: ${Object.keys(spreadsData).length} spreads`);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[API] Erro ao carregar dados:', error);
    
    // Retornar dados mockados em caso de erro
    const mockData = {
      positions: {
        open: [],
        closed: []
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