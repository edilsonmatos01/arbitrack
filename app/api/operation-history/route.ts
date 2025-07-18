import { NextRequest, NextResponse } from 'next/server';
import dbConnection from '@/lib/db-connection';

// GET - Buscar histórico de operações com filtros
export async function GET(req: NextRequest) {
  try {
    console.log('📡 GET /api/operation-history - Iniciando busca...');
    
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // all, 24h, day, range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const symbol = searchParams.get('symbol');

    console.log('🔍 Parâmetros da busca:', { filter, startDate, endDate, symbol });

    // Tentar buscar do banco usando conexão direta
    try {
      console.log('🗄️ Executando consulta no banco de dados...');
      
      // Primeiro, vamos contar quantos registros existem no total
      const totalCount = await dbConnection.getOperationHistoryCount();
      console.log('📊 Total de operações no banco:', totalCount);
      
      // Buscar operações
      const operations = await dbConnection.getOperationHistory(100);
      console.log('✅ Operações encontradas:', operations.length);
      
      // Aplicar filtros se necessário
      let filteredOperations = operations;
      
      if (symbol) {
        filteredOperations = operations.filter((op: any) => op.symbol === symbol);
      }
      
      if (filter !== 'all') {
        const now = new Date();
        switch (filter) {
          case '24h':
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            filteredOperations = operations.filter((op: any) => 
              new Date(op.finalizedAt) >= twentyFourHoursAgo
            );
            break;
          case 'day':
            if (startDate) {
              const dayStart = new Date(startDate);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(startDate);
              dayEnd.setHours(23, 59, 59, 999);
              filteredOperations = operations.filter((op: any) => {
                const opDate = new Date(op.finalizedAt);
                return opDate >= dayStart && opDate <= dayEnd;
              });
            }
            break;
          case 'range':
            if (startDate && endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              filteredOperations = operations.filter((op: any) => {
                const opDate = new Date(op.finalizedAt);
                return opDate >= start && opDate <= end;
              });
            }
            break;
        }
      }
      
      console.log('📋 Operações filtradas:', filteredOperations.length);
      return NextResponse.json(filteredOperations);
      
    } catch (dbError) {
      console.error('[API] Erro ao buscar do banco:', dbError);
      // Continua com fallback
    }

    // Fallback: retornar array vazio por enquanto
    console.log('📝 Usando fallback - retornando histórico vazio');
    return NextResponse.json([]);
  } catch (error) {
    console.error('[API] Erro ao buscar histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar novo registro no histórico
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📊 Dados recebidos na API:', body);
    
    const {
      symbol,
      quantity,
      spotEntryPrice,
      futuresEntryPrice,
      spotExitPrice,
      futuresExitPrice,
      spotExchange,
      futuresExchange,
      profitLossUsd,
      profitLossPercent,
      createdAt
    } = body;

    if (!symbol || !quantity || !spotEntryPrice || !futuresEntryPrice || 
        !spotExitPrice || !futuresExitPrice || !spotExchange || !futuresExchange) {
      console.error('❌ Campos obrigatórios faltando:', { symbol, quantity, spotEntryPrice, futuresEntryPrice, spotExitPrice, futuresExitPrice, spotExchange, futuresExchange });
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // Criar operação com ID único
    const operation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      quantity,
      spotEntryPrice,
      futuresEntryPrice,
      spotExitPrice,
      futuresExitPrice,
      spotExchange,
      futuresExchange,
      profitLossUsd,
      profitLossPercent,
      createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
      finalizedAt: new Date().toISOString()
    };

    // Tentar salvar no banco de dados usando conexão direta
    try {
      const query = `
        INSERT INTO "OperationHistory" (
          id, symbol, quantity, "spotEntryPrice", "futuresEntryPrice", 
          "spotExitPrice", "futuresExitPrice", "spotExchange", "futuresExchange", 
          "profitLossUsd", "profitLossPercent", "createdAt", "finalizedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const params = [
        operation.id,
        symbol,
        quantity,
        spotEntryPrice,
        futuresEntryPrice,
        spotExitPrice,
        futuresExitPrice,
        spotExchange,
        futuresExchange,
        profitLossUsd || 0,
        profitLossPercent || 0,
        createdAt ? new Date(createdAt) : new Date(),
        new Date()
      ];
      
      const result = await dbConnection.executeQuery(query, params);
      console.log('✅ Salvo no banco de dados:', result[0]);
      return NextResponse.json(result[0]);
    } catch (dbError) {
      console.error('[API] Erro no banco, usando fallback:', dbError);
      // Continua com fallback
    }

    // Fallback: salvar em arquivo temporário ou apenas retornar sucesso
    console.log('📝 Usando fallback - operação registrada:', operation);
    
    return NextResponse.json(operation);
  } catch (error) {
    console.error('[API] Erro ao criar registro no histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Excluir operação do histórico
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const operationId = searchParams.get('id');

    if (!operationId) {
      return NextResponse.json({ error: 'ID da operação é obrigatório' }, { status: 400 });
    }

    console.log('🗑️ Excluindo operação:', operationId);

    // Tentar excluir do banco de dados se disponível
    if (dbConnection) {
      try {
        const query = `
          DELETE FROM "OperationHistory" WHERE id = $1
          RETURNING *
        `;
        const params = [operationId];
        const result = await dbConnection.executeQuery(query, params);
        console.log('✅ Operação excluída do banco:', result[0]);
        return NextResponse.json({ success: true, deletedOperation: result[0] });
      } catch (dbError) {
        if (dbError instanceof Error && 'code' in dbError && dbError.code === 'P2025') {
          // Record not found
          console.log('[API] Operação não encontrada no banco:', operationId);
          return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 });
        }
        console.error('[API] Erro no banco ao excluir:', dbError);
        return NextResponse.json({ error: 'Erro ao excluir do banco de dados' }, { status: 500 });
      }
    }

    // Fallback: apenas retornar sucesso (já que não temos banco)
    console.log('📝 Usando fallback - exclusão simulada:', operationId);
    return NextResponse.json({ success: true, message: 'Operação excluída (fallback)' });
  } catch (error) {
    console.error('[API] Erro ao excluir operação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 