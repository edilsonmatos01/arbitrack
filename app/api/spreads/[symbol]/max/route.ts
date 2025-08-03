import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache em memória para melhorar performance
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Configuração para tornar a rota dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;



export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol;

  if (!symbol) {
    return NextResponse.json({ error: 'O símbolo é obrigatório' }, { status: 400 });
  }

  // Verificar cache primeiro
  const cached = cache.get(symbol);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log(`[API] Retornando dados em cache para ${symbol}`);
    return NextResponse.json(cached.data);
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log(`[API] Buscando spread máximo para ${symbol} desde ${twentyFourHoursAgo.toISOString()}`);

    // Buscar registros específicos do símbolo usando Prisma
    const records = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        spread: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    console.log(`[API] Encontrados ${records.length} registros para ${symbol}`);
    
    if (records.length > 0) {
      console.log(`[API] Primeiros 3 registros para ${symbol}:`, records.slice(0, 3));
    }

    if (records.length === 0) {
      console.log(`[API] Nenhum registro encontrado para ${symbol}`);
      const result = { spMax: null, crosses: 0 };
      cache.set(symbol, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    const spreads = records.map((r: any) => r.spread);
    const maxSpread = Math.max(...spreads);

    const result = {
      spMax: maxSpread,
      crosses: records.length
    };

    // Salvar no cache
    cache.set(symbol, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);

  } catch (error) {
    console.error(`Erro ao buscar estatísticas para o símbolo ${symbol}:`, error);
    const result = { spMax: null, crosses: 0 };
    cache.set(symbol, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);
  }
} 