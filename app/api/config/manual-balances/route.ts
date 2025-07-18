import { NextRequest, NextResponse } from 'next/server';
import dbConnection from '@/lib/db-connection';

// GET - Listar todos os saldos manuais
export async function GET() {
  try {
    const balances = await dbConnection.getManualBalances();
    return NextResponse.json(balances);
  } catch (error) {
    console.error('[API] Erro ao buscar saldos manuais:', error);
    return NextResponse.json([]);
  }
}

// POST - Criar novo saldo manual
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount, currency, description } = body;

    // Validações
    if (!name || !amount) {
      return NextResponse.json(
        { error: 'Nome e valor são obrigatórios' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Valor deve ser um número positivo' },
        { status: 400 }
      );
    }

    // Criar o saldo manual usando conexão direta
    const query = `
      INSERT INTO "ManualBalance" (id, name, amount, currency, description, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const id = `mb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const params = [
      id,
      name,
      amount,
      currency || 'USDT',
      description || null,
      now,
      now
    ];
    
    const result = await dbConnection.executeQuery(query, params);
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('[API] Erro ao criar saldo manual:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 