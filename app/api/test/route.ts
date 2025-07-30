import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'Definida' : 'Não definida'
  });
} 