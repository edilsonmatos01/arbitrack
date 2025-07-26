import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dados manuais de saldo da Gate.io
    const manualBalances = [
      {
        currency: 'USDT',
        available: '12543.67',
        locked: '651.22'
      },
      {
        currency: 'BTC',
        available: '0.0234',
        locked: '0.0012'
      },
      {
        currency: 'ETH',
        available: '0.156',
        locked: '0.023'
      }
    ];

    return NextResponse.json({ 
      balances: manualBalances,
      source: 'manual',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao retornar saldo manual da Gate.io:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 