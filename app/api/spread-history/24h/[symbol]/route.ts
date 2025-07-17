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

// Função para formatação de data/hora usando horário local
function formatDateTime(date: Date): string {
  try {
    // Usar horário local sem conversão de timezone
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month} - ${hours}:${minutes}`;
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

    console.log(`[API] Buscando dados do banco para ${symbol} (24h)...`);
    const startTime = Date.now();

    // Define o intervalo de 24 horas
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`[Timezone Debug] Agora (UTC): ${now.toISOString()}`);
    console.log(`[Timezone Debug] Início (UTC): ${start.toISOString()}`);
    console.log(`Buscando dados para ${symbol} de ${start.toISOString()} até ${now.toISOString()}`);

    // Buscar dados do banco
    const spreadHistory = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: start,
          lte: now
        },
        // Garante que só pegamos registros com spread válido
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

    console.log(`Encontrados ${spreadHistory.length} registros para ${symbol} em ${Date.now() - startTime}ms`);

    if (spreadHistory.length === 0) {
      console.log(`[API] Nenhum registro encontrado para ${symbol}`);
      // Salvar resultado vazio no cache
      cache.set(cacheKey, {
        data: [],
        timestamp: Date.now()
      });
      return NextResponse.json([]);
    }

    console.log(`[API] Primeiros 3 registros:`, spreadHistory.slice(0, 3));
    console.log(`[API] Últimos 3 registros:`, spreadHistory.slice(-3));

    // Agrupar dados em intervalos de 30 minutos usando Map
    const groupedData = new Map<string, { max: number; count: number }>();
    
    // Usar horário local sem conversão
    let currentTime = roundToNearestInterval(start, 30);
    const endTime = roundToNearestInterval(now, 30);

    while (currentTime <= endTime) {
      const timeKey = formatDateTime(currentTime);
      if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, {
          max: 0,
          count: 0
        });
      }
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    // Processar dados em lotes para melhor performance
    const batchSize = 1000;
    for (let i = 0; i < spreadHistory.length; i += batchSize) {
      const batch = spreadHistory.slice(i, i + batchSize);
      
      for (const record of batch) {
        // Usar timestamp do banco diretamente sem conversão
        const roundedTime = roundToNearestInterval(record.timestamp, 30);
        const timeKey = formatDateTime(roundedTime);
        
        const group = groupedData.get(timeKey);
        if (group) {
          group.max = Math.max(group.max, record.spread);
          group.count += 1;
        }
      }
    }

    // Converte para o formato esperado pelo gráfico
    const formattedData = Array.from(groupedData.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        spread_percentage: data.max
      }))
      .filter(item => item.spread_percentage > 0 && item.timestamp) // Garantir que tem timestamp válido
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

    console.log(`[API] Dados agrupados: ${groupedData.size} intervalos`);
    console.log(`[API] Dados formatados: ${formattedData.length} pontos`);
    
    if (formattedData.length === 0) {
      console.log(`[API] AVISO: Dados formatados estão vazios para ${symbol}`);
      console.log(`[API] Verificando groupedData:`, Array.from(groupedData.entries()).slice(0, 3));
    }

    // Salvar no cache
    cache.set(cacheKey, {
      data: formattedData,
      timestamp: Date.now()
    });

    console.log(`[API] Processamento concluído em ${Date.now() - startTime}ms`);
    console.log(`[API] Primeiro timestamp: ${formattedData[0]?.timestamp || 'N/A'}`);
    console.log(`[API] Último timestamp: ${formattedData[formattedData.length - 1]?.timestamp || 'N/A'}`);
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching spread history:', error);
    return NextResponse.json([]);
  }
} 