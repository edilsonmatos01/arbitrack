import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[TEST-SPREADS] Testando busca de spreads...');
  
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Prisma não disponível' });
    }

    console.log('[TEST-SPREADS] Prisma disponível, iniciando consulta...');
    const startTime = Date.now();

    // Teste 1: Contar total de spreads
    const totalCount = await prisma.spreadHistory.count();
    console.log(`[TEST-SPREADS] Total de spreads no banco: ${totalCount}`);

    // Teste 2: Buscar alguns spreads das últimas 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log(`[TEST-SPREADS] Buscando spreads desde: ${twentyFourHoursAgo.toISOString()}`);
    
    const recentSpreads = await prisma.spreadHistory.findMany({
      where: {
        timestamp: {
          gte: twentyFourHoursAgo
        }
      },
      select: {
        symbol: true,
        spread: true,
        timestamp: true
      },
      take: 10,
      orderBy: {
        timestamp: 'desc'
      }
    });

    const endTime = Date.now();
    console.log(`[TEST-SPREADS] Consulta concluída em ${endTime - startTime}ms`);
    console.log(`[TEST-SPREADS] Spreads recentes encontrados: ${recentSpreads.length}`);

    // Teste 3: Agrupar por símbolo
    const symbols = [...new Set(recentSpreads.map(s => s.symbol))];
    console.log(`[TEST-SPREADS] Símbolos únicos: ${symbols.length}`);

    return NextResponse.json({
      success: true,
      totalCount,
      recentSpreadsCount: recentSpreads.length,
      symbolsCount: symbols.length,
      sampleSpreads: recentSpreads.slice(0, 5),
      symbols: symbols.slice(0, 10)
    });

  } catch (error) {
    console.error('[TEST-SPREADS] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar spreads',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 