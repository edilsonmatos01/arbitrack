import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.warn('Aviso: Não foi possível conectar ao banco de dados');
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  // Se não houver símbolo, buscar todos os símbolos
  if (!symbol) {
    console.log('[API] Buscando spreads máximos para todos os símbolos');
  } else {
    console.log(`[API] Buscando spread máximo para ${symbol}`);
  }

  // Se não houver conexão com o banco, retorna valores nulos
  if (!prisma) {
    console.warn('Aviso: Banco de dados não disponível');
    return NextResponse.json({ spMax: null, crosses: 0 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log(`[API] Buscando spread máximo para ${symbol} desde ${twentyFourHoursAgo.toISOString()}`);

    // Buscar registros das últimas 24h
    const whereClause: any = {
      timestamp: {
        gte: twentyFourHoursAgo,
      }
    };

    // Adicionar filtro de símbolo se fornecido
    if (symbol) {
      whereClause.symbol = symbol;
    }

    const records = await prisma.spreadHistory.findMany({
      where: whereClause,
      select: {
        symbol: true,
        spread: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    console.log(`[API] Encontrados ${records.length} registros`);

    if (records.length === 0) {
      console.log(`[API] Nenhum registro encontrado`);
      return NextResponse.json([]);
    }

    if (symbol) {
      // Retorno para símbolo específico
      const spreads = records.map(r => r.spread);
      const maxSpread = Math.max(...spreads);
      
      console.log(`[API] Estatísticas para ${symbol}:`);
      console.log(`   Máximo: ${maxSpread.toFixed(2)}%`);
      console.log(`   Total: ${spreads.length} registros`);

      return NextResponse.json({
        spMax: maxSpread,
        crosses: records.length
      });
    } else {
      // Retorno para todos os símbolos - agrupar por símbolo
      const groupedBySymbol = new Map();
      
      for (const record of records) {
        const symbolKey = record.symbol || 'UNKNOWN';
        if (!groupedBySymbol.has(symbolKey)) {
          groupedBySymbol.set(symbolKey, []);
        }
        groupedBySymbol.get(symbolKey).push(record.spread);
      }

      const result = Array.from(groupedBySymbol.entries()).map(([symbolKey, spreads]) => ({
        symbol: symbolKey,
        maxSpread: Math.max(...spreads),
        count: spreads.length
      })).sort((a, b) => b.maxSpread - a.maxSpread);

      console.log(`[API] Encontrados spreads para ${result.length} símbolos`);
      return NextResponse.json(result);
    }

  } catch (error) {
    console.error(`Erro ao buscar estatísticas para o símbolo ${symbol}:`, error);
    return NextResponse.json({ spMax: null, crosses: 0 });
  }
} 