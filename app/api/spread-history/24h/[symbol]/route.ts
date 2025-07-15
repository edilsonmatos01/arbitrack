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
    const cacheKey = `spread-history-24h-${symbol}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log(`[Cache] Retornando dados em cache para ${symbol} (24h)`);
      return NextResponse.json(cachedData.data);
    }

    console.log(`[API] Buscando dados do banco para ${symbol} (24h)...`);
    const startTime = Date.now();

    // Define o intervalo de 24 horas em UTC
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Otimização: usar select específico e limitar dados
    const spreadHistory = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: start,
          lte: now
        },
        // Garantir que só pegamos registros com spread válido
        spread: { gt: 0 }
      },
      select: {
        timestamp: true,
        spread: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    console.log(`[API] Encontrados ${spreadHistory.length} registros em ${Date.now() - startTime}ms`);

    // Otimização: processar dados em lotes
    const groupedData = new Map<string, number>();
    
    // Criar datas no fuso horário de São Paulo corretamente
    const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
    const startInSaoPaulo = toZonedTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'America/Sao_Paulo');
    
    let currentTime = roundToNearestInterval(startInSaoPaulo, 30);
    const endTime = roundToNearestInterval(nowInSaoPaulo, 30);

    // Inicializar intervalos
    while (currentTime <= endTime) {
      const timeKey = formatDateTime(currentTime);
      if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, 0);
      }
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    // Processar dados em lotes
    const batchSize = 1000;
    for (let i = 0; i < spreadHistory.length; i += batchSize) {
      const batch = spreadHistory.slice(i, i + batchSize);
      
      for (const record of batch) {
        // Converter timestamp do banco para fuso de São Paulo usando date-fns-tz
        const recordInSaoPaulo = toZonedTime(record.timestamp, 'America/Sao_Paulo');
        const roundedTime = roundToNearestInterval(recordInSaoPaulo, 30);
        const timeKey = formatDateTime(roundedTime);
        const currentMax = groupedData.get(timeKey) || 0;
        groupedData.set(timeKey, Math.max(currentMax, record.spread));
      }
    }

    // Converte para o formato esperado pelo gráfico e ordena
    const formattedData = Array.from(groupedData.entries())
      .map(([timestamp, spread]) => ({
        timestamp,
        spread_percentage: spread
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
      data: formattedData,
      timestamp: Date.now()
    });

    console.log(`[API] Processamento concluído em ${Date.now() - startTime}ms`);
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching spread history:', error);
    return NextResponse.json([]);
  }
} 