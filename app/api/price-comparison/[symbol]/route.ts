import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { toZonedTime, format } from 'date-fns-tz';

let prisma: PrismaClient | null = null;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.warn('Aviso: Não foi possível conectar ao banco de dados');
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache em memória para dados recentes (5 minutos)
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para limpar cache
function clearCache() {
  cache.clear();
  console.log('[CACHE] Cache limpo');
}

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

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol;
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (!prisma) {
      console.warn('Aviso: Banco de dados não disponível');
      return NextResponse.json([]);
    }

    // Verificar cache primeiro
    const cacheKey = `price-comparison-${symbol}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log(`[Cache] Retornando dados em cache para ${symbol} (price-comparison)`);
      return NextResponse.json(cachedData.data);
    }

    console.log(`[API] Buscando dados do banco para ${symbol} (price-comparison)...`);
    const startTime = Date.now();

    // Define o intervalo de 24 horas
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`Buscando dados para ${symbol} de ${start.toISOString()} até ${now.toISOString()}`);

    // Otimização: usar select específico e limitar dados
    const priceHistory = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: start,
          lte: now
        },
        // Garante que só pegamos registros com preços válidos
        spotPrice: { gt: 0 },
        futuresPrice: { gt: 0 }
      },
      select: {
        timestamp: true,
        spotPrice: true,
        futuresPrice: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    console.log(`Encontrados ${priceHistory.length} registros para ${symbol} em ${Date.now() - startTime}ms`);

    if (priceHistory.length === 0) {
      // Salvar resultado vazio no cache
      cache.set(cacheKey, {
        data: [],
        timestamp: Date.now()
      });
      return NextResponse.json([]);
    }

    // Otimização: agrupar dados em intervalos de 30 minutos usando Map
    const groupedData = new Map<string, { 
      spot: { sum: number; count: number }; 
      futures: { sum: number; count: number }; 
    }>();
    
    // Criar datas no fuso horário de São Paulo corretamente
    const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
    const startInSaoPaulo = toZonedTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'America/Sao_Paulo');
    
    let currentTime = roundToNearestInterval(startInSaoPaulo, 30);
    const endTime = roundToNearestInterval(nowInSaoPaulo, 30);

    while (currentTime <= endTime) {
      const timeKey = formatDateTime(currentTime);
      if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, {
          spot: { sum: 0, count: 0 },
          futures: { sum: 0, count: 0 }
        });
      }
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    // Processar dados em lotes para melhor performance
    const batchSize = 1000;
    for (let i = 0; i < priceHistory.length; i += batchSize) {
      const batch = priceHistory.slice(i, i + batchSize);
      
      for (const record of batch) {
        // Converter timestamp do banco para fuso de São Paulo usando date-fns-tz
        const recordInSaoPaulo = toZonedTime(record.timestamp, 'America/Sao_Paulo');
        const roundedTime = roundToNearestInterval(recordInSaoPaulo, 30);
        const timeKey = formatDateTime(roundedTime);
        
        const group = groupedData.get(timeKey);
        if (group) {
          group.spot.sum += record.spotPrice;
          group.spot.count += 1;
          group.futures.sum += record.futuresPrice;
          group.futures.count += 1;
        }
      }
    }

    // Converte para o formato esperado pelo gráfico
    const formattedData = Array.from(groupedData.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        gateio_price: data.spot.count > 0 ? data.spot.sum / data.spot.count : 0,
        mexc_price: data.futures.count > 0 ? data.futures.sum / data.futures.count : 0
      }))
      .filter(item => item.gateio_price > 0 && item.mexc_price > 0)
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

    // Salvar no cache
    cache.set(cacheKey, {
      data: formattedData,
      timestamp: Date.now()
    });

    console.log(`[API] Processamento concluído em ${Date.now() - startTime}ms`);
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching price comparison:', error);
    return NextResponse.json([]);
  }
} 