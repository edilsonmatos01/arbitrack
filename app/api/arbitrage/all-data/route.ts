import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    // Lista de símbolos para buscar
    const symbols = [
      'ERA_USDT', 'WHITE_USDT', 'NAM_USDT', 'BOXCAT_USDT', 'VANRY_USDT',
      'PIN_USDT', 'DEVVE_USDT', 'VR_USDT', 'KEKIUS_USDT'
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
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month} - ${hours}:${minutes}`;
}

function roundToNearestInterval(date: Date, intervalMinutes: number): Date {
  const minutes = Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
  const rounded = new Date(date);
  rounded.setMinutes(minutes, 0, 0);
  return rounded;
} 