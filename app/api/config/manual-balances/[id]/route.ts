import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Atualizar saldo manual
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    // Verificar se o saldo existe
    const existingBalance = await prisma.manualBalance.findUnique({
      where: { id }
    });

    if (!existingBalance) {
      return NextResponse.json(
        { error: 'Saldo não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o saldo manual
    const balance = await prisma.manualBalance.update({
      where: { id },
      data: {
        name,
        amount,
        currency: currency || 'USDT',
        description: description || null
      }
    });

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Erro ao atualizar saldo manual:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover saldo manual
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar se o saldo existe
    const existingBalance = await prisma.manualBalance.findUnique({
      where: { id }
    });

    if (!existingBalance) {
      return NextResponse.json(
        { error: 'Saldo não encontrado' },
        { status: 404 }
      );
    }

    // Remover o saldo manual
    await prisma.manualBalance.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Saldo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover saldo manual:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 