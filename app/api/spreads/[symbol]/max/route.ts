import { NextResponse } from 'next/server';
import { robustPrisma } from '@/lib/prisma-robust';

// Configuração para tornar a rota dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Função para gerar dados simulados para desenvolvimento
function generateMockData(symbol: string) {
  // Gerar spread baseado no símbolo para consistência
  const symbolHash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const baseSpread = (symbolHash % 50) / 10 + 0.5; // Entre 0.5% e 5.5%
  const variation = Math.sin(Date.now() / 10000) * 0.5; // Variação temporal
  const mockSpread = Math.max(0.1, baseSpread + variation);
  
  const mockCrosses = Math.floor(Math.random() * 50) + 20; // Entre 20 e 70 registros
  
  return {
    spMax: parseFloat(mockSpread.toFixed(2)),
    crosses: mockCrosses
  };
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol;

  if (!symbol) {
    return NextResponse.json({ error: 'O símbolo é obrigatório' }, { status: 400 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Buscar registros específicos do símbolo usando Prisma robusto
    const records = await robustPrisma.spreadHistory.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        spread: true,
      },
    });

    if (records.length === 0) {
      const mockData = generateMockData(symbol);
      return NextResponse.json(mockData);
    }

    const spreads = records.map((r: any) => r.spread);
    const maxSpread = Math.max(...spreads);

    return NextResponse.json({
      spMax: maxSpread,
      crosses: records.length
    });

  } catch (error) {
    console.error(`Erro ao buscar estatísticas para o símbolo ${symbol}:`, error);
    const mockData = generateMockData(symbol);
    return NextResponse.json(mockData);
  }
} 