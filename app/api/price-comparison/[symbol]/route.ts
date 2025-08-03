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

// Cache em memória otimizado com TTL
class OptimizedCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 1000; // Limite máximo de itens no cache

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    // Limpar cache se estiver muito cheio
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new OptimizedCache();

function formatDateTime(date: Date): string {
  try {
    // Usar a mesma lógica que funcionou na correção do Spread 24h
    const saoPauloTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const day = saoPauloTime.getDate().toString().padStart(2, '0');
    const month = (saoPauloTime.getMonth() + 1).toString().padStart(2, '0');
    const hour = saoPauloTime.getHours().toString().padStart(2, '0');
    const minute = saoPauloTime.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} - ${hour}:${minute}`;
  } catch (error) {
    console.error('[DateTime Error] Erro na formatação de data:', error);
    return '00/00 - 00:00';
  }
}

function roundToNearestInterval(date: Date, intervalMinutes: number): Date {
  const minutes = Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
  const rounded = new Date(date);
  rounded.setMinutes(minutes, 0, 0);
  return rounded;
}

// Função otimizada para agrupar dados de preços
function groupPriceDataOptimized(data: any[], intervalMinutes: number = 30) {
  const grouped = new Map<string, { 
    spot: { sum: number; count: number }; 
    futures: { sum: number; count: number }; 
  }>();
  
  for (const record of data) {
    const roundedTime = roundToNearestInterval(record.timestamp, intervalMinutes);
    const timeKey = formatDateTime(roundedTime);
    
    const existing = grouped.get(timeKey);
    if (existing) {
      if (record.spotPrice > 0) {
        existing.spot.sum += record.spotPrice;
        existing.spot.count += 1;
      }
      if (record.futuresPrice > 0) {
        existing.futures.sum += record.futuresPrice;
        existing.futures.count += 1;
      }
    } else {
      grouped.set(timeKey, {
        spot: { 
          sum: record.spotPrice > 0 ? record.spotPrice : 0, 
          count: record.spotPrice > 0 ? 1 : 0 
        },
        futures: { 
          sum: record.futuresPrice > 0 ? record.futuresPrice : 0, 
          count: record.futuresPrice > 0 ? 1 : 0 
        }
      });
    }
  }
  
  return grouped;
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const nocache = searchParams.get('nocache') === 'true';
    
    console.log(`[API] Price Comparison - Symbol recebido: ${symbol}, refresh: ${refresh}, nocache: ${nocache}`);
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (!prisma) {
      console.warn('Aviso: Banco de dados não disponível');
      return NextResponse.json([]);
    }

    // Verificar cache primeiro (pular se refresh ou nocache)
    const cacheKey = `price-comparison-${symbol}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && !refresh && !nocache) {
      console.log(`[Cache] Retornando dados em cache para ${symbol} (price-comparison)`);
      return NextResponse.json(cachedData);
    }
    
    // Limpar cache se solicitado
    if (refresh || nocache) {
      console.log(`[Cache] Limpando cache para ${symbol} (refresh: ${refresh}, nocache: ${nocache})`);
      cache.clear();
    }

    console.log(`[API] Buscando dados do banco para ${symbol} (price-comparison)...`);
    const startTime = Date.now();

    // Define o intervalo de 24 horas
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Consulta otimizada com LIMIT e select específico
    const priceHistory = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: start,
          lte: now
        }
      },
      select: {
        timestamp: true,
        spotPrice: true,
        futuresPrice: true
      },
      orderBy: {
        timestamp: 'asc'
      },
      // Limitar a 25.000 registros para garantir cobertura completa
      take: 25000
    });

    console.log(`Encontrados ${priceHistory.length} registros para ${symbol} em ${Date.now() - startTime}ms`);

    if (priceHistory.length === 0) {
      cache.set(cacheKey, [], 2 * 60 * 1000); // Cache por 2 minutos para dados vazios
      return NextResponse.json([]);
    }

    // Agrupar dados otimizado
    const groupedData = groupPriceDataOptimized(priceHistory, 30);

    // Converte para o formato esperado pelo gráfico
    const formattedData = Array.from(groupedData.entries())
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

    // Salvar no cache com TTL de 5 minutos
    cache.set(cacheKey, formattedData, 5 * 60 * 1000);

    console.log(`[API] Processamento concluído em ${Date.now() - startTime}ms`);
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching price comparison:', error);
    return NextResponse.json([]);
  }
} 