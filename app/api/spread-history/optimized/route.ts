import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toZonedTime, format } from 'date-fns-tz';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache em memória para dados recentes (10 minutos)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

function formatDateTime(date: Date): string {
  // Converter para fuso horário de São Paulo usando date-fns-tz
  const saoPauloTime = toZonedTime(date, 'America/Sao_Paulo');
  return format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (!prisma) {
      console.warn('Aviso: Banco de dados não disponível');
      return NextResponse.json([]);
    }

    // Verificar cache primeiro
    const cacheKey = `spread-history-optimized-${symbol}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log(`[Cache] Retornando dados em cache para ${symbol}`);
      return NextResponse.json(cachedData.data);
    }

    console.log(`[API] Buscando dados otimizados para ${symbol}...`);
    const startTime = Date.now();

    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Consulta otimizada usando SQL raw para melhor performance
    const rawHistory = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', timestamp) + 
        INTERVAL '30 min' * (EXTRACT(MINUTE FROM timestamp)::int / 30) as bucket_time,
        MAX(spread) as max_spread
      FROM "SpreadHistory"
      WHERE symbol = ${symbol}
        AND timestamp >= ${start}
        AND timestamp <= ${now}
      GROUP BY bucket_time
      ORDER BY bucket_time ASC
    `;

    console.log(`[API] Consulta SQL executada em ${Date.now() - startTime}ms`);

    // Formatar dados usando timezone correto
    const formattedHistory = (rawHistory as any[]).map(record => ({
      timestamp: formatDateTime(new Date(record.bucket_time)),
      spread: parseFloat(record.max_spread)
    }));

    // Salvar no cache
    cache.set(cacheKey, {
      data: formattedHistory,
      timestamp: Date.now()
    });

    console.log(`[API] Processamento concluído em ${Date.now() - startTime}ms`);
    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching optimized spread history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 