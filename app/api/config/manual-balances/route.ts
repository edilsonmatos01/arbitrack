import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// GET - Listar todos os saldos manuais
export async function GET() {
  try {
    const prisma = new PrismaClient();
    const balances = await prisma.manualBalance.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    await prisma.$disconnect();
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

    // Criar o saldo manual usando Prisma
    const prisma = new PrismaClient();
    
    const id = `mb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const result = await prisma.manualBalance.create({
      data: {
        id,
        name,
        amount,
        currency: currency || 'USDT',
        description: description || null,
        createdAt: now,
        updatedAt: now
      }
    });
    
    await prisma.$disconnect();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] Erro ao criar saldo manual:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 