import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dados manuais de saldo da MEXC
    const manualBalances = [
      {
        asset: 'USDT',
        free: '8765.23',
        locked: '531.11'
      },
      {
        asset: 'BTC',
        free: '0.0189',
        locked: '0.0008'
      },
      {
        asset: 'ETH',
        free: '0.123',
        locked: '0.015'
      }
    ];

    return NextResponse.json({ 
      balances: manualBalances,
      source: 'manual',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao retornar saldo manual da MEXC:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 