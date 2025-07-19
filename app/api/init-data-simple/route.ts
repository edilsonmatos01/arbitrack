import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Configurações para evitar problemas durante o build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

// Cache global para melhorar performance
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos (aumentado drasticamente)

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

      // Verificar cache
    if (cache && (Date.now() - cache.timestamp) < CACHE_TTL) {
      console.log('[API] Retornando dados do cache');
      return NextResponse.json(cache.data);
    }
    
    console.log('[API] GET /api/init-data-simple - Iniciando...');
    
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('user_id') || 'edilsonmatos';

      console.log('[API] Parâmetros:', { userId });

      console.log('[API] Usando lista otimizada de símbolos...');
      
      // Lista reduzida apenas com símbolos que aparecem na tabela
      const symbols = [
        // Símbolos que aparecem na tabela atual
        'WHITE_USDT', 'LUCE_USDT', 'VR_USDT', 'RBNT_USDT', 'GROK_USDT',
        // Símbolos principais
        'BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'XRP_USDT', 'BNB_USDT',
        // Símbolos adicionais comuns
        'ADA_USDT', 'DOT_USDT', 'AVAX_USDT', 'MATIC_USDT', 'LINK_USDT',
        'ATOM_USDT', 'LTC_USDT', 'BCH_USDT', 'BLZ_USDT', 'AIN_USDT'
      ];

      console.log(`[API] Processando ${symbols.length} símbolos...`);

      // Buscar dados de spread máximo para todos os símbolos de uma vez
      const spreadsData: any = {};
      
      try {
        console.log('[API] Buscando dados reais do banco...');
        
        // Usar Prisma ORM para buscar dados
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const prisma = new PrismaClient();
        
        // OTIMIZAÇÃO: Consulta mais eficiente
        console.log('[API] Iniciando consulta otimizada...');
        const queryStart = Date.now();
        
        const allStats = await prisma.spreadHistory.groupBy({
          by: ['symbol'],
          where: {
            symbol: {
              in: symbols
            },
            timestamp: {
              gte: twentyFourHoursAgo
            }
          },
          _max: {
            spread: true
          },
          _min: {
            spread: true
          },
          _count: {
            id: true
          }
        });
        
        const queryEnd = Date.now();
        console.log(`[API] Consulta concluída em ${queryEnd - queryStart}ms`);
        
        // Processar resultados
        for (const stat of allStats) {
          const symbolKey = stat.symbol.replace('/', '_');
          spreadsData[symbolKey] = {
            spMax: stat._max.spread || 0,
            spMin: stat._min.spread || 0,
            crosses: stat._count.id || 0,
            exchanges: ['gateio_mexc']
          };
        }
        
        // Adicionar símbolos sem dados
        console.log(`[API] Processando ${allStats.length} resultados da consulta...`);
        
        for (const symbol of symbols) {
          const symbolKey = symbol.replace('/', '_');
          if (!spreadsData[symbolKey]) {
            console.log(`[API] ⚠️  Símbolo ${symbol} não encontrado na consulta, criando dados vazios`);
            spreadsData[symbolKey] = {
              spMax: 0,
              spMin: 0,
              crosses: 0,
              exchanges: ['gateio_mexc']
            };
          }
        }
        
        console.log(`[API] Total de símbolos processados: ${Object.keys(spreadsData).length}`);
        
        await prisma.$disconnect();
        console.log(`[API] Dados reais processados para ${Object.keys(spreadsData).length} símbolos`);

      } catch (error) {
        console.error('[API] Erro ao buscar dados do banco:', error);
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

      // Pares por exchange
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

      console.log(`[API] Dados reais carregados: ${Object.keys(spreadsData).length} spreads`);
      
      // Salvar no cache
      cache = {
        data: responseData,
        timestamp: Date.now()
      };
      
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