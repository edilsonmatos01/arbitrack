import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toZonedTime, format } from 'date-fns-tz';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache em memória para dados recentes (5 minutos)
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    console.log(`[API] Spread History - Symbol recebido: ${symbol}`);

    if (!symbol || symbol.trim() === '') {
      console.error('[API] Symbol inválido ou vazio');
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Verificar cache primeiro
    const cacheKey = `spread-history-${symbol}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log(`[Cache] Retornando dados em cache para ${symbol}`);
      return NextResponse.json(cachedData.data);
    }

    console.log(`[API] Buscando dados do banco para ${symbol}...`);
    const startTime = Date.now();

    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (!prisma) {
      console.warn('[API] Aviso: Banco de dados não disponível');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Otimização: usar select específico e limitar dados
    const rawHistory = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: start,
          lte: now
        }
      },
      select: {
        timestamp: true,
        spread: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    console.log(`[API] Encontrados ${rawHistory.length} registros em ${Date.now() - startTime}ms`);

    // Agrupar dados em intervalos de 30 minutos usando horário local
    const groupedData = new Map<string, number>();
    
    // Usar horário local sem conversão
    let currentTime = roundToNearestInterval(start, 30);
    const endTime = roundToNearestInterval(now, 30);

    while (currentTime <= endTime) {
      const timeKey = formatDateTime(currentTime);
      if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, 0);
      }
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    // Otimização: processar em lotes menores
    const batchSize = 1000;
    for (let i = 0; i < rawHistory.length; i += batchSize) {
      const batch = rawHistory.slice(i, i + batchSize);
      
      for (const record of batch) {
        // Usar timestamp do banco diretamente sem conversão
        const roundedTime = roundToNearestInterval(record.timestamp, 30);
        const timeKey = formatDateTime(roundedTime);
        
        const currentMax = groupedData.get(timeKey) || 0;
        groupedData.set(timeKey, Math.max(currentMax, record.spread));
      }
    }

    const formattedHistory = Array.from(groupedData.entries())
      .map(([timestamp, spread]) => ({
        timestamp,
        spread: spread,
      }))
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
      data: formattedHistory,
      timestamp: Date.now()
    });

    console.log(`[API] Processamento concluído em ${Date.now() - startTime}ms`);
    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('[API] Error fetching spread history:', error);
    
    // Se for erro de conexão com banco, retornar erro específico
    if (error instanceof Error && error.message.includes('Can\'t reach database server')) {
      return NextResponse.json({ 
        error: 'Database connection failed',
        message: 'Unable to connect to database server'
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 