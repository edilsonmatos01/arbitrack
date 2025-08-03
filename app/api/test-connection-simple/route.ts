import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[TEST-CONNECTION-SIMPLE] Testando conexão...');
  
  try {
    console.log('[TEST-CONNECTION-SIMPLE] DATABASE_URL:', process.env.DATABASE_URL ? 'Definida' : 'Não definida');
    console.log('[TEST-CONNECTION-SIMPLE] Prisma disponível:', !!prisma);

    if (!prisma) {
      return NextResponse.json({ 
        error: 'Prisma não disponível',
        databaseUrl: process.env.DATABASE_URL ? 'Definida' : 'Não definida'
      });
    }

    console.log('[TEST-CONNECTION-SIMPLE] Tentando consulta simples...');
    
    // Teste simples: contar registros
    const count = await prisma.spreadHistory.count();
    console.log('[TEST-CONNECTION-SIMPLE] Total de registros:', count);

    return NextResponse.json({
      success: true,
      message: 'Conexão com banco estabelecida',
      databaseUrl: process.env.DATABASE_URL ? 'Definida' : 'Não definida',
      totalRecords: count
    });

  } catch (error) {
    console.error('[TEST-CONNECTION-SIMPLE] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro na conexão',
      details: error instanceof Error ? error.message : String(error),
      databaseUrl: process.env.DATABASE_URL ? 'Definida' : 'Não definida'
    });
  }
} 