import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[TEST-DB] Testando conexão com banco...');
  
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Prisma não disponível' });
    }

    // Teste simples: contar registros
    const spreadCount = await prisma.spreadHistory.count();
    const positionCount = await prisma.position.count();
    
    // Teste: buscar alguns spreads
    const spreads = await prisma.spreadHistory.findMany({
      take: 5,
      select: {
        symbol: true,
        spread: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Teste: buscar algumas posições
    const positions = await prisma.position.findMany({
      take: 5,
      select: {
        id: true,
        symbol: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      counts: {
        spreads: spreadCount,
        positions: positionCount
      },
      sampleSpreads: spreads,
      samplePositions: positions
    });

  } catch (error) {
    console.error('[TEST-DB] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao conectar com banco',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 