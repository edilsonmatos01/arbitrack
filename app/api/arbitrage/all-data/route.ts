import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toZonedTime, format } from 'date-fns-tz';

// Cache em memória para melhorar performance
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    if (!prisma) {
      console.warn('Aviso: Banco de dados não disponível');
      return NextResponse.json({ error: 'Banco de dados não disponível' }, { status: 500 });
    }

    // Verificar cache primeiro
    const cacheKey = 'all-arbitrage-data';
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log('[API] Retornando dados em cache para all-arbitrage-data');
      return NextResponse.json(cached.data);
    }

    console.log('[API] Buscando todos os dados de arbitragem...');
    const startTime = Date.now();

    // Lista de símbolos para buscar - TODOS os pares das duas listas fornecidas
    const symbols = [
      // Gate.io – Lista de pares
      '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
      'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
      'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'DADDY_USDT', 'DAG_USDT', 'DEGEN_USDT',
      'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT', 'WMTX_USDT', 'PIN_USDT',
      'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT', 'TARA_USDT', 'BERT_USDT',
      'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT', 'RBNT_USDT', 'TOMI_USDT',
      'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT', 'ALPINE_USDT', 'CITY_USDT',
      'ILV_USDT', 'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'SYS_USDT', 'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT',
      'LUNAI_USDT', 'MORE_USDT', 'MGO_USDT', 'GROK_USDT',
      
      // MEXC – Lista de pares (adicionais)
      'CUDIS_USDT', 'ENJ_USDT', 'ALICE_USDT', 'PSG_USDT', 'REX_USDT', 'B_USDT', 'RED_USDT', 'GTC_USDT', 'TALE_USDT', 'RWA_USDT',
      'CESS_USDT', 'QUBIC_USDT', 'TEL_USDT', 'SHM_USDT', 'DOLO_USDT', 'LABUBU_USDT', 'ZIG_USDT', 'BAR_USDT', 'MASA_USDT', 'XEM_USDT',
      'ULTI_USDT', 'LUMIA_USDT', 'PONKE_USDT',
      
      // Pares adicionais que estavam aparecendo na tabela
      'VANRY_USDT', 'POLS_USDT', 'EPIC_USDT', 'CLOUD_USDT', 'DGB_USDT', 'OG_USDT', 'FLM_USDT'
    ];

    // Buscar spreads máximos primeiro (consulta mais leve)
    console.log('[API] Buscando spreads máximos...');
    const maxSpreads: Record<string, { spMax: number | null; crosses: number }> = {};
    
    for (const symbol of symbols) {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const maxSpreadResult = await prisma.spreadHistory.findFirst({
          where: {
            symbol: symbol,
            timestamp: {
              gte: twentyFourHoursAgo,
            },
          },
          select: {
            spread: true
          },
          orderBy: {
            spread: 'desc'
          }
        });

        const countResult = await prisma.spreadHistory.count({
          where: {
            symbol: symbol,
            timestamp: {
              gte: twentyFourHoursAgo,
            },
          }
        });

        maxSpreads[symbol] = {
          spMax: maxSpreadResult?.spread || null,
          crosses: countResult
        };

        console.log(`[API] ${symbol}: max=${maxSpreadResult?.spread?.toFixed(2)}%, count=${countResult}`);
      } catch (error) {
        console.error(`Erro ao buscar dados para ${symbol}:`, error);
        maxSpreads[symbol] = { spMax: null, crosses: 0 };
      }
    }

    // Buscar dados de gráficos em lotes menores
    console.log('[API] Buscando dados de gráficos...');
    const chartData: Record<string, { spreadHistory: any[]; priceComparison: any[] }> = {};

    for (const symbol of symbols) {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Buscar dados agrupados por hora para reduzir volume
        const records = await prisma.spreadHistory.findMany({
          where: {
            symbol: symbol,
            timestamp: {
              gte: twentyFourHoursAgo,
            },
          },
          select: {
            spread: true,
            timestamp: true,
            spotPrice: true,
            futuresPrice: true
          },
          orderBy: {
            timestamp: 'asc'
          }
        });

        if (records.length > 0) {
          // Processar dados de gráficos
          const groupedSpreadData = new Map<string, { max: number; count: number }>();
          const groupedPriceData = new Map<string, { 
            spot: { sum: number; count: number }; 
            futures: { sum: number; count: number }; 
          }>();
          
          for (const record of records) {
            const roundedTime = roundToNearestInterval(record.timestamp, 30);
            const timeKey = formatDateTime(roundedTime);
            
            // Spread history
            const spreadGroup = groupedSpreadData.get(timeKey) || { max: 0, count: 0 };
            spreadGroup.max = Math.max(spreadGroup.max, record.spread);
            spreadGroup.count += 1;
            groupedSpreadData.set(timeKey, spreadGroup);
            
            // Price comparison
            const priceGroup = groupedPriceData.get(timeKey) || {
              spot: { sum: 0, count: 0 },
              futures: { sum: 0, count: 0 }
            };
            
            priceGroup.spot.sum += record.spotPrice;
            priceGroup.spot.count += 1;
            priceGroup.futures.sum += record.futuresPrice;
            priceGroup.futures.count += 1;
            
            groupedPriceData.set(timeKey, priceGroup);
          }

          const spreadHistoryData = Array.from(groupedSpreadData.entries())
            .map(([timestamp, data]) => ({
              timestamp,
              spread_percentage: data.max
            }))
            .filter(item => item.spread_percentage > 0)
            .sort((a, b) => {
              const [dateA, timeA] = a.timestamp.split(' - ');
              const [dateB, timeB] = b.timestamp.split(' - ');
              const [dayA, monthA] = dateA.split('/').map(Number);
              const [dayB, monthB] = dateB.split('/').map(Number);
              const [hourA, minuteA] = timeA.split(':').map(Number);
              const [hourB, minuteB] = timeB.split(':').map(Number);
              
              if (monthA !== monthB) return monthA - monthB;
              if (dayA !== dayB) return dayA - dayB;
              if (hourA !== hourB) return hourA - hourB;
              return minuteA - minuteB;
            });

          const priceComparisonData = Array.from(groupedPriceData.entries())
            .map(([timestamp, data]) => ({
              timestamp,
              gateio_price: data.spot.count > 0 ? data.spot.sum / data.spot.count : null,
              mexc_price: data.futures.count > 0 ? data.futures.sum / data.futures.count : null
            }))
            .filter(item => item.gateio_price !== null || item.mexc_price !== null)
            .sort((a, b) => {
              const [dateA, timeA] = a.timestamp.split(' - ');
              const [dateB, timeB] = b.timestamp.split(' - ');
              const [dayA, monthA] = dateA.split('/').map(Number);
              const [dayB, monthB] = dateB.split('/').map(Number);
              const [hourA, minuteA] = timeA.split(':').map(Number);
              const [hourB, minuteB] = timeB.split(':').map(Number);
              
              if (monthA !== monthB) return monthA - monthB;
              if (dayA !== dayB) return dayA - dayB;
              if (hourA !== hourB) return hourA - hourB;
              return minuteA - minuteB;
            });

          chartData[symbol] = {
            spreadHistory: spreadHistoryData,
            priceComparison: priceComparisonData
          };
        } else {
          chartData[symbol] = { spreadHistory: [], priceComparison: [] };
        }
      } catch (error) {
        console.error(`Erro ao buscar dados de gráfico para ${symbol}:`, error);
        chartData[symbol] = { spreadHistory: [], priceComparison: [] };
      }
    }

    // Organizar dados por símbolo
    const result = {
      maxSpreads,
      chartData,
      timestamp: new Date().toISOString()
    };

    // Salvar no cache
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log(`[API] Dados carregados em ${Date.now() - startTime}ms`);
    console.log(`[API] Símbolos processados: ${symbols.length}`);
    console.log(`[API] Spreads máximos encontrados: ${Object.values(maxSpreads).filter(s => s.spMax !== null).length}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro ao buscar todos os dados de arbitragem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Funções auxiliares
function formatDateTime(date: Date): string {
  // Converter para fuso horário de São Paulo usando date-fns-tz
  const saoPauloTime = toZonedTime(date, 'America/Sao_Paulo');
  return format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
}

function roundToNearestInterval(date: Date, intervalMinutes: number): Date {
  const minutes = Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
  const rounded = new Date(date);
  rounded.setMinutes(minutes, 0, 0);
  return rounded;
} 