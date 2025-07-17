import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Listar todos os saldos manuais
export async function GET() {
  try {
    const balances = await prisma.manualBalance.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(balances);
  } catch (error) {
    console.error('Erro ao buscar saldos manuais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
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

    // Criar o saldo manual
    const balance = await prisma.manualBalance.create({
      data: {
        name,
        amount,
        currency: currency || 'USDT',
        description: description || null
      }
    });

    return NextResponse.json(balance, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar saldo manual:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 