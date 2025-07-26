import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toZonedTime, format } from 'date-fns-tz';

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

// Função para formatação de data/hora otimizada
function formatDateTime(date: Date): string {
  try {
    // Usar a mesma lógica que funcionou na simulação
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

// Função otimizada para agrupar dados
function groupDataOptimized(data: any[], intervalMinutes: number = 30) {
  const grouped = new Map<string, { max: number; count: number }>();
  
  for (const record of data) {
    const roundedTime = roundToNearestInterval(record.timestamp, intervalMinutes);
    const timeKey = formatDateTime(roundedTime);
    
    const existing = grouped.get(timeKey);
    if (existing) {
      existing.max = Math.max(existing.max, record.spread);
      existing.count += 1;
    } else {
      grouped.set(timeKey, { max: record.spread, count: 1 });
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
    
    console.log(`[API] Spread History 24h - Symbol recebido: ${symbol}, refresh: ${refresh}, nocache: ${nocache}`);
    
    if (!symbol || symbol.trim() === '') {
      console.error('[API] Symbol inválido ou vazio');
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (!prisma) {
      console.warn('[API] Aviso: Banco de dados não disponível');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Verificar cache primeiro (pular se refresh ou nocache)
    const cacheKey = `spread-history-24h-${symbol}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && !refresh && !nocache) {
      console.log(`[Cache] Retornando dados em cache para ${symbol} (24h)`);
      return NextResponse.json(cachedData);
    }
    
    // Limpar cache se solicitado
    if (refresh || nocache) {
      console.log(`[Cache] Limpando cache para ${symbol} (refresh: ${refresh}, nocache: ${nocache})`);
      cache.clear();
    }
    
    console.log(`[API] Buscando dados do banco para ${symbol} (24h)...`);
    const startTime = Date.now();

    // Define o intervalo de 24 horas
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Consulta otimizada com LIMIT e índices
    const spreadHistory = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: start,
          lte: now
        },
        spread: { gt: 0 }
      },
      select: {
        timestamp: true,
        spread: true
      },
      orderBy: {
        timestamp: 'asc'
      },
      // Limitar a 25.000 registros para garantir cobertura completa
      take: 25000
    });

    console.log(`Encontrados ${spreadHistory.length} registros para ${symbol} em ${Date.now() - startTime}ms`);

    if (spreadHistory.length === 0) {
      console.log(`[API] Nenhum registro encontrado para ${symbol}`);
      cache.set(cacheKey, [], 2 * 60 * 1000); // Cache por 2 minutos para dados vazios
      return NextResponse.json([]);
    }

    // Agrupar dados otimizado
    const groupedData = groupDataOptimized(spreadHistory, 30);

    // Converte para o formato esperado pelo gráfico
    const formattedData = Array.from(groupedData.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        spread_percentage: data.max
      }))
      .filter(item => item.spread_percentage > 0 && item.timestamp)
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
    console.log(`[API] Dados formatados: ${formattedData.length} pontos`);
    
    return NextResponse.json(formattedData);
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