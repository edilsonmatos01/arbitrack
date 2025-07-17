import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Cache para os dados
let cache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Iniciando carregamento de dados de inicialização...');
    
    // Verificar se o Prisma está disponível
    if (!prisma) {
      console.error('[API] Prisma client não inicializado');
      throw new Error('Prisma client não inicializado');
    }
    
    // Verificar cache
    const now = Date.now();
    if (cache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('[API] Retornando dados do cache');
      return NextResponse.json(cache);
    }
    
    // Forçar nova busca (sempre limpar cache para debug)
    console.log('[API] Forçando nova busca (cache sempre limpo para debug)');
    cache = null;
    cacheTimestamp = 0;

    // Buscar símbolos monitorados (incluindo todos os que aparecem na tabela)
    const symbols = [
      'ERA_USDT', 'WHITE_USDT', 'NAM_USDT', 'BOXCAT_USDT', 
      'VANRY_USDT', 'PIN_USDT', 'DEVVE_USDT', 'VR_USDT', 'KEKIUS_USDT',
      'HOLD_USDT', 'POLS_USDT', 'LAVA_USDT', 'MOONPIG_USDT', 'DEAI_USDT',
      // Adicionar símbolos que aparecem na tabela mas não estavam na lista
      'SOLO_USDT', 'DOG_USDT', 'PRIME_USDT', 'FARTCOIN_USDT', 'FWOG_USDT',
      'USELESS_USDT', 'BLZ_USDT', 'AIN_USDT', 'TRB_USDT', 'CHILLGUY_USDT',
      'GNC_USDT', 'LAMBO_USDT', 'VELO_USDT', 'ZIG_USDT', 'QUBIC_USDT'
    ];

    console.log('[API] Processando', symbols.length, 'símbolos...');
    
    // TESTE: Verificar se o banco está disponível
    let dbAvailable = false;
    try {
      const testCount = await prisma!.spreadHistory.count();
      console.log(`[API] Banco disponível - Total de registros: ${testCount}`);
      dbAvailable = true;
    } catch (dbError) {
      console.error('[API] Banco de dados não disponível:', dbError);
      console.log('[API] Usando dados mockados temporariamente...');
      dbAvailable = false;
    }
    
    let maxSpreads = [];
    
    if (dbAvailable) {
      // Banco disponível - usar dados reais
      console.log('[API] Usando dados reais do banco...');
      
      // Buscar spreads máximos de forma otimizada
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Buscar todos os spreads máximos em uma única consulta otimizada
      const maxSpreadsData = await prisma!.spreadHistory.groupBy({
        by: ['symbol'],
        where: {
          symbol: { in: symbols },
          timestamp: { gte: twentyFourHoursAgo }
        },
        _max: {
          spread: true
        },
        _count: {
          symbol: true
        }
      });
      
      // Formatar os resultados
      maxSpreads = maxSpreadsData.map(item => ({
        symbol: item.symbol,
        maxSpread: item._max.spread || 0,
        count: item._count.symbol
      }));
      
      // Adicionar símbolos que não têm dados
      const foundSymbols = maxSpreadsData.map(item => item.symbol);
      const missingSymbols = symbols.filter(symbol => !foundSymbols.includes(symbol));
      
      missingSymbols.forEach(symbol => {
        maxSpreads.push({ symbol, maxSpread: 0, count: 0 });
      });
      
    } else {
      // Banco não disponível - usar dados mockados
      console.log('[API] Criando dados mockados...');
      maxSpreads = symbols.map(symbol => ({
        symbol,
        maxSpread: Math.random() * 10 + 1, // Spread aleatório entre 1% e 11%
        count: Math.floor(Math.random() * 1000) + 100 // Contagem aleatória
      }));
    }
    
    console.log('[API] Spreads processados:', maxSpreads.length);

    // Montar resposta simplificada
    const response = {
      timestamp: new Date().toISOString(),
      symbols: symbols,
      maxSpreads: maxSpreads,
      historicalData: [], // Vazio para simplificar
      priceComparison: [], // Vazio para simplificar
      opportunities: [], // Será preenchido pelo frontend
      dbAvailable: dbAvailable // Flag para indicar se o banco está disponível
    };

    // Atualizar cache
    cache = response;
    cacheTimestamp = now;

    console.log('[API] Dados carregados com sucesso');
    console.log('[API] Banco disponível:', dbAvailable);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao carregar dados de inicialização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 