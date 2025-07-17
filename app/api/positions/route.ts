import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Cache em memória para melhorar performance
const positionsCache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 segundos

// GET - Buscar posições com filtro por usuário
export async function GET(req: NextRequest) {
  console.log('[API] GET /api/positions - Iniciando...');
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const id = searchParams.get('id');
    const cacheKey = `positions_${userId || 'all'}_${id || 'list'}`;

    console.log('[API] Parâmetros:', { userId, id });

    // Verificar cache primeiro
    const cached = positionsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('[API] Retornando dados do cache');
      return NextResponse.json(cached.data);
    }

    // Se não há prisma, retornar dados mockados para performance
    if (!prisma) {
      console.warn('[API] Banco de dados não disponível, retornando dados mockados');
      const mockData: any[] = [];
      positionsCache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Timeout reduzido para 3 segundos (mais agressivo)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 3000);
    });

    let positionsPromise;

    if (id) {
      // Buscar posição específica por ID
      positionsPromise = prisma.position.findUnique({
        where: { id }
      }).then(pos => pos ? [pos] : []);
    } else {
      // Buscar posições com filtros otimizados
      const whereClause: any = {};
      
      // Adicionar filtro por usuário se fornecido
      if (userId) {
        // Por enquanto, não temos campo user_id, então buscamos todas
        // TODO: Implementar filtro por usuário quando o schema for atualizado
        console.log('[API] Filtro por usuário solicitado:', userId);
      }

      positionsPromise = prisma.position.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        take: 20, // Reduzido ainda mais para melhor performance
        select: {
          id: true,
          symbol: true,
          quantity: true,
          spotEntry: true,
          futuresEntry: true,
          spotExchange: true,
          futuresExchange: true,
          isSimulated: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    const positions = await Promise.race([positionsPromise, timeoutPromise]) as any[];

    // Armazenar no cache
    positionsCache.set(cacheKey, { data: positions, timestamp: Date.now() });

    console.log(`[API] ${positions.length} posições encontradas`);
    return NextResponse.json(positions);
  } catch (error) {
    console.error('[API] Erro ao buscar posições:', error);
    
    // Retornar dados mockados em caso de erro para não quebrar o frontend
    const mockData: any[] = [];
    return NextResponse.json(mockData);
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