import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Buscar todas as posições
export async function GET(req: NextRequest) {
  console.log('[API] GET /api/positions - Iniciando...');
  
  try {
    if (!prisma) {
      console.warn('[API] Aviso: Banco de dados não disponível');
      return NextResponse.json([]);
    }

    // Verificar conexão com o banco
    try {
      if (prisma) {
        await prisma.$connect();
        console.log('[API] Conexão com banco estabelecida');
      }
    } catch (dbError) {
      console.error('[API] Erro ao conectar com banco:', dbError);
      return NextResponse.json({ error: 'Erro de conexão com banco de dados' }, { status: 503 });
    }

    const positions = await prisma.position.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`[API] ${positions.length} posições encontradas`);
    return NextResponse.json(positions);
  } catch (error) {
    console.error('[API] Erro ao buscar posições:', error);
    
    // Retornar array vazio em caso de erro para não quebrar o frontend
    return NextResponse.json([]);
  } finally {
    try {
      if (prisma) {
        await prisma.$disconnect();
      }
    } catch (disconnectError) {
      console.warn('[API] Erro ao desconectar banco:', disconnectError);
    }
  }
}

// POST - Criar nova posição
export async function POST(req: NextRequest) {
  console.log('[API] POST /api/positions - Iniciando...');
  
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Banco de dados não disponível' }, { status: 500 });
    }

    const body = await req.json();
    console.log('[API] Dados recebidos:', body);
    const { symbol, quantity, spotEntry, futuresEntry, spotExchange, futuresExchange, isSimulated } = body;

    if (!symbol || !quantity || !spotEntry || !futuresEntry || !spotExchange || !futuresExchange) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const position = await prisma.position.create({
      data: {
        symbol,
        quantity,
        spotEntry,
        futuresEntry,
        spotExchange,
        futuresExchange,
        isSimulated: isSimulated || false
      }
    });

    console.log('[API] Posição criada:', position);
    return NextResponse.json(position);
  } catch (error) {
    console.error('[API] Erro ao criar posição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Remover posição
export async function DELETE(req: NextRequest) {
  console.log('[API] DELETE /api/positions - Iniciando...');
  
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Banco de dados não disponível' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    console.log('[API] Removendo posição com ID:', id);

    if (!id) {
      return NextResponse.json({ error: 'ID da posição é obrigatório' }, { status: 400 });
    }

    await prisma.position.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Posição removida com sucesso', id });
  } catch (error) {
    console.error('[API] Erro ao remover posição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 