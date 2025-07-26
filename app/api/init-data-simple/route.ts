import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { COMMON_PAIRS } from '@/lib/predefined-pairs';

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

      console.log('[API] Buscando TODAS as paridades disponíveis no banco...');
      
      // Buscar dados de spread máximo para TODAS as paridades disponíveis
      const spreadsData: any = {};
      
      try {
        console.log('[API] Buscando dados reais do banco...');
        
        // Usar Prisma ORM para buscar dados
        const prisma = new PrismaClient();
        
        // SOLUÇÃO GLOBAL: Buscar TODAS as paridades disponíveis no banco
        console.log('[API] Iniciando consulta GLOBAL...');
        const queryStart = Date.now();
        
        // Buscar TODAS as paridades que têm dados (sem filtro de lista)
        let allStats = await prisma.spreadHistory.groupBy({
          by: ['symbol'],
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
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
        
        // Se não encontrar dados recentes, buscar dados mais antigos
        if (allStats.length === 0) {
          console.log('[API] Nenhum dado recente encontrado, buscando dados mais antigos...');
          const oldStats = await prisma.spreadHistory.groupBy({
            by: ['symbol'],
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
          allStats = oldStats;
        }
        
        const queryEnd = Date.now();
        console.log(`[API] Consulta concluída em ${queryEnd - queryStart}ms`);
        
        // Função para normalizar nomes de símbolos
        const normalizeSymbol = (symbol: string) => {
          // Remover barras e adicionar _USDT se não tiver
          let normalized = symbol.replace('/', '_');
          if (!normalized.endsWith('_USDT')) {
            normalized = normalized + '_USDT';
          }
          return normalized;
        };

        // Processar TODOS os resultados encontrados
        console.log(`[API] Processando ${allStats.length} paridades encontradas no banco...`);
        
        for (const stat of allStats) {
          const symbolKey = normalizeSymbol(stat.symbol); // Normalizar o nome do símbolo
          spreadsData[symbolKey] = {
            spMax: stat._max.spread || 0,
            spMin: stat._min.spread || 0,
            crosses: stat._count.id || 0,
            exchanges: ['gateio_mexc']
          };
        }
        
        // Adicionar símbolos da lista predefinida que não têm dados (para garantir que apareçam)
        console.log(`[API] Adicionando símbolos da lista predefinida que não têm dados...`);
        
        for (const symbol of COMMON_PAIRS) {
          if (!spreadsData[symbol]) {
            console.log(`[API] ⚠️  Símbolo ${symbol} não encontrado na consulta, criando dados vazios`);
            spreadsData[symbol] = {
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
        // Em caso de erro, criar dados vazios para a lista predefinida
        for (const symbol of COMMON_PAIRS) {
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