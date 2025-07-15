import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache em memória para dados recentes (5 minutos)
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function formatDateTime(date: Date): string {
  // Converter para fuso horário de São Paulo corretamente
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(', ', ' - ');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
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

    const thirtyMinutesInMs = 30 * 60 * 1000;
    const now = new Date();
    // Usar UTC para consulta no banco, mas converter para São Paulo na exibição
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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

    const aggregatedData: Record<number, { maxSpread: number; date: Date }> = {};

    // Otimização: processar em lotes menores
    const batchSize = 1000;
    for (let i = 0; i < rawHistory.length; i += batchSize) {
      const batch = rawHistory.slice(i, i + batchSize);
      
      for (const record of batch) {
        // Converter timestamp do banco para fuso de São Paulo
        const saoPauloTime = new Date(record.timestamp.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const bucketTimestamp = Math.floor(saoPauloTime.getTime() / thirtyMinutesInMs) * thirtyMinutesInMs;
        
        if (!aggregatedData[bucketTimestamp] || record.spread > aggregatedData[bucketTimestamp].maxSpread) {
          aggregatedData[bucketTimestamp] = {
            maxSpread: record.spread,
            date: new Date(bucketTimestamp)
          };
        }
      }
    }

    const formattedHistory = Object.entries(aggregatedData)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([_, data]) => ({
        timestamp: formatDateTime(data.date),
        spread: data.maxSpread,
      }));

    // Salvar no cache
    cache.set(cacheKey, {
      data: formattedHistory,
      timestamp: Date.now()
    });

    console.log(`[API] Processamento concluído em ${Date.now() - startTime}ms`);
    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching spread history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 