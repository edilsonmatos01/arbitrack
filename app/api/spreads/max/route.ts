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

  if (!symbol) {
    return NextResponse.json({ error: 'O símbolo é obrigatório' }, { status: 400 });
  }

  // Se não houver conexão com o banco, retorna valores nulos
  if (!prisma) {
    console.warn('Aviso: Banco de dados não disponível');
    return NextResponse.json({ spMax: null, crosses: 0 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log(`[API] Buscando spread máximo para ${symbol} desde ${twentyFourHoursAgo.toISOString()}`);

    // Buscar TODOS os registros das últimas 24h sem filtros adicionais
    const records = await prisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: twentyFourHoursAgo,
        },
        // Remover filtros que possam estar causando problemas
        // spread: { gt: 0 } // Removido para debug
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

    if (records.length === 0) {
      console.log(`[API] Nenhum registro encontrado para ${symbol}`);
      return NextResponse.json({ spMax: null, crosses: 0 });
    }

    // Calcular estatísticas
    const spreads = records.map(r => r.spread);
    const maxSpread = Math.max(...spreads);
    const minSpread = Math.min(...spreads);
    const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;

    console.log(`[API] Estatísticas para ${symbol}:`);
    console.log(`   Máximo: ${maxSpread.toFixed(2)}%`);
    console.log(`   Mínimo: ${minSpread.toFixed(2)}%`);
    console.log(`   Média: ${avgSpread.toFixed(2)}%`);
    console.log(`   Total: ${spreads.length} registros`);

    // Verificar se há spreads muito diferentes
    const uniqueSpreads = [...new Set(spreads)];
    if (uniqueSpreads.length < 10) {
      console.log(`[API] Spreads únicos: ${uniqueSpreads.map(s => s.toFixed(2)).join(', ')}`);
    }

    return NextResponse.json({
      spMax: maxSpread,
      crosses: records.length
    });

  } catch (error) {
    console.error(`Erro ao buscar estatísticas para o símbolo ${symbol}:`, error);
    return NextResponse.json({ spMax: null, crosses: 0 });
  }
} 