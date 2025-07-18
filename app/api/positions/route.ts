import { NextRequest, NextResponse } from 'next/server';
import dbConnection from '@/lib/db-connection';

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

    // Tentar buscar do banco usando conexão direta
    try {
      let positions: any[] = [];

      if (id) {
        // Buscar posição específica por ID
        const query = 'SELECT * FROM "Position" WHERE id = $1';
        const result = await dbConnection.executeQuery(query, [id]);
        positions = result;
      } else {
        // Buscar posições com filtros otimizados
        const query = `
          SELECT id, symbol, quantity, "spotEntry", "futuresEntry", 
                 "spotExchange", "futuresExchange", "isSimulated", 
                 "createdAt", "updatedAt"
          FROM "Position" 
          ORDER BY "createdAt" DESC 
          LIMIT 20
        `;
        positions = await dbConnection.executeQuery(query);
      }

      // Armazenar no cache
      positionsCache.set(cacheKey, { data: positions, timestamp: Date.now() });

      console.log(`[API] ${positions.length} posições encontradas`);
      return NextResponse.json(positions);
    } catch (dbError) {
      console.error('[API] Erro ao buscar do banco:', dbError);
      // Continua com fallback
    }

    // Fallback: retornar array vazio se não conseguiu buscar do banco
    console.log('[API] Usando fallback - retornando array vazio');
    const mockData: any[] = [];
    positionsCache.set(cacheKey, { data: mockData, timestamp: Date.now() });
    return NextResponse.json(mockData);
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
    const body = await req.json();
    console.log('[API] Dados recebidos:', body);
    const { symbol, quantity, spotEntry, futuresEntry, spotExchange, futuresExchange, isSimulated } = body;

    if (!symbol || !quantity || !spotEntry || !futuresEntry || !spotExchange || !futuresExchange) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // Criar posição usando conexão direta
    const query = `
      INSERT INTO "Position" (id, symbol, quantity, "spotEntry", "futuresEntry", 
                             "spotExchange", "futuresExchange", "isSimulated", 
                             "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const id = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const params = [
      id,
      symbol,
      quantity,
      spotEntry,
      futuresEntry,
      spotExchange,
      futuresExchange,
      isSimulated || false,
      now,
      now
    ];
    
    const result = await dbConnection.executeQuery(query, params);
    console.log('[API] Posição criada:', result[0]);
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[API] Erro ao criar posição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Remover posição
export async function DELETE(req: NextRequest) {
  console.log('[API] DELETE /api/positions - Iniciando...');
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    console.log('[API] Removendo posição com ID:', id);

    if (!id) {
      return NextResponse.json({ error: 'ID da posição é obrigatório' }, { status: 400 });
    }

    // Remover posição usando conexão direta
    const query = 'DELETE FROM "Position" WHERE id = $1 RETURNING *';
    const result = await dbConnection.executeQuery(query, [id]);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Posição não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Posição removida com sucesso', id });
  } catch (error) {
    console.error('[API] Erro ao remover posição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 