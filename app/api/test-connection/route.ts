import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[TEST-CONNECTION] Testando conexão...');
  
  try {
    console.log('[TEST-CONNECTION] DATABASE_URL:', process.env.DATABASE_URL ? 'Definida' : 'Não definida');
    console.log('[TEST-CONNECTION] Prisma disponível:', !!prisma);

    if (!prisma) {
      return NextResponse.json({ 
        error: 'Prisma não disponível',
        databaseUrl: process.env.DATABASE_URL ? 'Definida' : 'Não definida'
      });
    }

    // Teste simples de conexão
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[TEST-CONNECTION] Teste de conexão bem-sucedido:', result);

    return NextResponse.json({
      success: true,
      message: 'Conexão com banco estabelecida',
      databaseUrl: process.env.DATABASE_URL ? 'Definida' : 'Não definida',
      testResult: result
    });

  } catch (error) {
    console.error('[TEST-CONNECTION] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro na conexão',
      details: error instanceof Error ? error.message : String(error),
      databaseUrl: process.env.DATABASE_URL ? 'Definida' : 'Não definida'
    });
  }
} 