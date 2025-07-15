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

// Cache em memória para dados recentes (15 minutos)
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

// SOLUÇÃO DEFINITIVA: Função que força a conversão correta para São Paulo
function formatDateTimeForSaoPaulo(date: Date): string {
  // Força a conversão para São Paulo, independentemente do ambiente
  const saoPauloTime = toZonedTime(date, 'America/Sao_Paulo');
  return format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
}

// SOLUÇÃO DEFINITIVA: Função que arredonda para intervalos de 30 minutos
function roundToNearestInterval(date: Date, intervalMinutes: number): Date {
  const minutes = Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
  const rounded = new Date(date);
  rounded.setMinutes(minutes, 0, 0);
  return rounded;
}

// SOLUÇÃO DEFINITIVA: Função que converte UTC para São Paulo
function convertUTCToSaoPaulo(utcDate: Date): Date {
  return toZonedTime(utcDate, 'America/Sao_Paulo');
}

// SOLUÇÃO DEFINITIVA: Função de fallback que força conversão manual se necessário
function forceSaoPauloConversion(date: Date): Date {
  try {
    // Tentar conversão normal primeiro
    const converted = toZonedTime(date, 'America/Sao_Paulo');
    
    // Verificar se a conversão parece correta (não está 3 horas atrás)
    const originalHour = date.getUTCHours();
    const convertedHour = converted.getHours();
    
    // Se a diferença for exatamente 3 horas, pode ser um problema do ambiente
    if (Math.abs(originalHour - convertedHour) === 3) {
      console.log('[WARNING] Possível problema de timezone detectado, usando fallback');
      // Aplicar conversão manual: UTC-3 para São Paulo
      const manualConversion = new Date(date.getTime() - (3 * 60 * 60 * 1000));
      return manualConversion;
    }
    
    return converted;
  } catch (error) {
    console.log('[WARNING] Erro na conversão automática, usando fallback manual');
    // Fallback: converter manualmente UTC-3
    return new Date(date.getTime() - (3 * 60 * 60 * 1000));
  }
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol;
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (!prisma) {
      console.warn('Aviso: Banco de dados não disponível');
      return NextResponse.json([]);
    }

    // Verificar cache primeiro (a menos que forceRefresh seja true)
    const cacheKey = `spread-history-24h-${symbol}`;
    const cachedData = cache.get(cacheKey);
    if (!forceRefresh && cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log(`[Cache] Retornando dados em cache para ${symbol} (24h)`);
      return NextResponse.json(cachedData.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
          'X-Cache': 'HIT'
        }
      });
    }

    console.log(`[API] Buscando dados do banco para ${symbol} (24h)...`);
    const startTime = Date.now();

    // SOLUÇÃO DEFINITIVA: Definir intervalo de 24 horas em UTC
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`[DEBUG] Buscando dados de ${start.toISOString()} até ${now.toISOString()}`);
    console.log(`[DEBUG] Timezone atual: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

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

    // SOLUÇÃO DEFINITIVA: Processar dados com conversão forçada para São Paulo
    const groupedData = new Map<string, number>();
    
    // SOLUÇÃO DEFINITIVA: Converter datas para São Paulo com fallback
    const nowInSaoPaulo = forceSaoPauloConversion(now);
    const startInSaoPaulo = forceSaoPauloConversion(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    
    console.log(`[DEBUG] Agora em São Paulo: ${formatDateTimeForSaoPaulo(nowInSaoPaulo)}`);
    console.log(`[DEBUG] Início em São Paulo: ${formatDateTimeForSaoPaulo(startInSaoPaulo)}`);
    
    // SOLUÇÃO DEFINITIVA: Criar intervalos de 30 minutos em São Paulo
    let currentTime = roundToNearestInterval(startInSaoPaulo, 30);
    const endTime = roundToNearestInterval(nowInSaoPaulo, 30);

    while (currentTime <= endTime) {
      const timeKey = formatDateTimeForSaoPaulo(currentTime);
      if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, 0);
      }
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    // SOLUÇÃO DEFINITIVA: Processar dados com conversão forçada
    const batchSize = 1000;
    for (let i = 0; i < spreadHistory.length; i += batchSize) {
      const batch = spreadHistory.slice(i, i + batchSize);
      
      for (const record of batch) {
        // SOLUÇÃO DEFINITIVA: Converter timestamp do banco (UTC) para São Paulo com fallback
        const recordInSaoPaulo = forceSaoPauloConversion(record.timestamp);
        const roundedTime = roundToNearestInterval(recordInSaoPaulo, 30);
        const timeKey = formatDateTimeForSaoPaulo(roundedTime);
        
        const currentMax = groupedData.get(timeKey) || 0;
        groupedData.set(timeKey, Math.max(currentMax, record.spread));
      }
    }

    // Log para debug
    console.log(`[DEBUG] Dados processados: ${spreadHistory.length} registros`);
    console.log(`[DEBUG] Chaves de tempo criadas: ${groupedData.size}`);
    
    // Log das primeiras e últimas chaves de tempo
    const timeKeys = Array.from(groupedData.keys()).sort();
    if (timeKeys.length > 0) {
      console.log(`[DEBUG] Primeira chave: ${timeKeys[0]}`);
      console.log(`[DEBUG] Última chave: ${timeKeys[timeKeys.length - 1]}`);
    }

    // SOLUÇÃO DEFINITIVA: Converter para o formato esperado pelo gráfico
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
    return NextResponse.json(formattedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Error fetching spread history:', error);
    return NextResponse.json([]);
  }
} 