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

function formatDateTime(date: Date): string {
  // Converter para fuso horário de São Paulo usando date-fns-tz
  const saoPauloTime = toZonedTime(date, 'America/Sao_Paulo');
  return format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
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

    console.log(`[DEBUG] Buscando dados de ${start.toISOString()} até ${now.toISOString()}`);

    // Buscar todos os registros no intervalo UTC
    const spreadHistory = await prisma.spreadHistory.findMany({
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

    console.log(`[DEBUG] Encontrados ${spreadHistory.length} registros`);

    if (spreadHistory.length === 0) {
      return NextResponse.json([]);
    }

    // Agrupar por intervalos de 30 minutos em UTC
    const groupedData = new Map<string, number>();
    
    // Criar intervalos de 30 minutos em UTC
    let currentTime = new Date(start);
    currentTime.setMinutes(Math.floor(currentTime.getMinutes() / 30) * 30, 0, 0);
    
    const endTime = new Date(now);
    endTime.setMinutes(Math.floor(endTime.getMinutes() / 30) * 30, 0, 0);
    
    while (currentTime <= endTime) {
      const timeKey = formatDateTime(currentTime); // Converte para SP apenas na formatação
      groupedData.set(timeKey, 0);
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    // Processar dados em lotes
    const batchSize = 1000;
    for (let i = 0; i < spreadHistory.length; i += batchSize) {
      const batch = spreadHistory.slice(i, i + batchSize);
      for (const record of batch) {
        // Arredondar o timestamp em UTC
        const roundedTime = new Date(record.timestamp);
        roundedTime.setMinutes(Math.floor(roundedTime.getMinutes() / 30) * 30, 0, 0);
        const timeKey = formatDateTime(roundedTime); // Converte para SP apenas na formatação
        const currentMax = groupedData.get(timeKey) || 0;
        groupedData.set(timeKey, Math.max(currentMax, record.spread));
      }
    }

    // Log para debug
    console.log(`[DEBUG] Dados processados: ${spreadHistory.length} registros`);
    console.log(`[DEBUG] Intervalo: ${start.toISOString()} até ${now.toISOString()}`);
    console.log(`[DEBUG] Último registro: ${spreadHistory[spreadHistory.length - 1]?.timestamp.toISOString()}`);
    console.log(`[DEBUG] Chaves de tempo criadas: ${groupedData.size}`);

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