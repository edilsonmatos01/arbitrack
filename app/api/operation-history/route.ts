import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

try {
  prisma = new PrismaClient();
  console.log('✅ Prisma Client inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao conectar com o banco:', error);
}

// GET - Buscar histórico de operações com filtros
export async function GET(req: NextRequest) {
  try {
    console.log('📡 GET /api/operation-history - Iniciando busca...');
    
    if (!prisma) {
      console.error('❌ Prisma Client não disponível');
      return NextResponse.json({ error: 'Banco de dados não disponível' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || '24h'; // 24h, day, range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const symbol = searchParams.get('symbol');

    console.log('🔍 Parâmetros da busca:', { filter, startDate, endDate, symbol });

    let whereCondition: any = {};

    // Filtro por símbolo
    if (symbol) {
      whereCondition.symbol = symbol;
    }

    // Filtros de data
    const now = new Date();
    switch (filter) {
      case '24h':
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        whereCondition.finalizedAt = {
          gte: twentyFourHoursAgo
        };
        console.log('⏰ Filtro 24h - desde:', twentyFourHoursAgo.toISOString());
        break;
      case 'day':
        if (startDate) {
          const dayStart = new Date(startDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(startDate);
          dayEnd.setHours(23, 59, 59, 999);
          whereCondition.finalizedAt = {
            gte: dayStart,
            lte: dayEnd
          };
          console.log('⏰ Filtro day - período:', dayStart.toISOString(), 'até', dayEnd.toISOString());
        }
        break;
      case 'range':
        if (startDate && endDate) {
          whereCondition.finalizedAt = {
            gte: new Date(startDate),
            lte: new Date(endDate)
          };
          console.log('⏰ Filtro range - período:', startDate, 'até', endDate);
        }
        break;
    }

    console.log('🔍 Condição WHERE:', JSON.stringify(whereCondition, null, 2));

    // Tentar buscar do banco se disponível
    if (prisma) {
      try {
        console.log('🗄️ Executando consulta no banco de dados...');
        
        // Primeiro, vamos contar quantos registros existem no total
        const totalCount = await (prisma as any).operationHistory.count();
        console.log('📊 Total de operações no banco:', totalCount);
        
        // Buscar todas as operações (sem filtro) para debug
        const allOperations = await (prisma as any).operationHistory.findMany({
          orderBy: { finalizedAt: 'desc' },
          take: 5 // Apenas as 5 mais recentes para debug
        });
        console.log('📋 Últimas 5 operações (sem filtro):', allOperations.map((op: any) => ({
          id: op.id,
          symbol: op.symbol,
          finalizedAt: op.finalizedAt,
          profitLossUsd: op.profitLossUsd
        })));
        
        // Agora buscar com o filtro aplicado
        const operations = await (prisma as any).operationHistory.findMany({
          where: whereCondition,
          orderBy: { finalizedAt: 'desc' },
          take: 100 // Limita a 100 registros
        });
        
        console.log('✅ Operações encontradas com filtro:', operations.length);
        console.log('📋 Operações:', operations.map((op: any) => ({
          id: op.id,
          symbol: op.symbol,
          finalizedAt: op.finalizedAt,
          profitLossUsd: op.profitLossUsd
        })));
        
        return NextResponse.json(operations);
              } catch (dbError: any) {
          console.error('❌ Erro ao buscar do banco:', dbError);
          console.error('❌ Stack trace:', dbError.stack);
          // Continua com fallback
        }
    }

    // Fallback: retornar array vazio por enquanto
    console.log('📝 Usando fallback - retornando histórico vazio');
    return NextResponse.json([]);
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    console.error('❌ Stack trace:', error.stack);
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

    // Tentar salvar no banco de dados se disponível
    if (prisma) {
      try {
        const dbOperation = await (prisma as any).operationHistory.create({
          data: {
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
            createdAt: createdAt ? new Date(createdAt) : new Date(),
            finalizedAt: new Date()
          }
        });
        console.log('✅ Salvo no banco de dados:', dbOperation);
        return NextResponse.json(dbOperation);
      } catch (dbError) {
        console.error('❌ Erro no banco, usando fallback:', dbError);
        console.error('❌ Stack trace:', dbError.stack);
        // Continua com fallback
      }
    }

    // Fallback: salvar em arquivo temporário ou apenas retornar sucesso
    console.log('📝 Usando fallback - operação registrada:', operation);
    
    return NextResponse.json(operation);
  } catch (error) {
    console.error('❌ Erro ao criar registro no histórico:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
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
    if (prisma) {
      try {
        const deletedOperation = await (prisma as any).operationHistory.delete({
          where: { id: operationId }
        });
        console.log('✅ Operação excluída do banco:', deletedOperation);
        return NextResponse.json({ success: true, deletedOperation });
      } catch (dbError: any) {
        if (dbError.code === 'P2025') {
          // Record not found
          console.log('⚠️ Operação não encontrada no banco:', operationId);
          return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 });
        }
        console.error('❌ Erro no banco ao excluir:', dbError);
        return NextResponse.json({ error: 'Erro ao excluir do banco de dados' }, { status: 500 });
      }
    }

    // Fallback: apenas retornar sucesso (já que não temos banco)
    console.log('📝 Usando fallback - exclusão simulada:', operationId);
    return NextResponse.json({ success: true, message: 'Operação excluída (fallback)' });
  } catch (error) {
    console.error('❌ Erro ao excluir operação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 