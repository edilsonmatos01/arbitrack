export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { NextResponse } from 'next/server';
import ccxt, { Balances } from 'ccxt';
import { getApiCredentials } from '@/lib/api-credentials';

export async function GET() {
  try {
    // Tentar obter credenciais do banco de dados primeiro
    let apiKey = process.env.GATEIO_API_KEY;
    let apiSecret = process.env.GATEIO_API_SECRET;
    
    const dbCredentials = await getApiCredentials('gateio');
    if (dbCredentials) {
      apiKey = dbCredentials.apiKey;
      apiSecret = dbCredentials.apiSecret;
    }

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { 
          error: 'Credenciais do Gate.io não configuradas', 
          details: 'Configure suas API Keys na página de Configurações' 
        },
        { status: 500 }
      );
    }

    console.log('🔄 Buscando saldo de futures do Gate.io...');

    const exchange = new ccxt.gateio({
      apiKey: apiKey,
      secret: apiSecret,
      options: {
        defaultType: 'future', // Para futures
      },
    });

    const balanceData: Balances = await exchange.fetchBalance();
    
    console.log('📊 Saldo bruto Gate.io Futures:', balanceData);

    // Processar os dados para um formato consistente
    const usdtBalance = balanceData.USDT || { total: 0, free: 0, used: 0 };
    
    const processedBalances = {
      success: true,
      exchange: 'gateio',
      balances: {
        USDT: {
          total: usdtBalance.total || 0,
          free: usdtBalance.free || 0,
          used: usdtBalance.used || 0,
          type: 'futures'
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ Saldo processado Gate.io Futures:', processedBalances);

    return NextResponse.json(processedBalances);

  } catch (error: any) {
    console.error('❌ Erro ao buscar saldo Gate.io Futures:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: 'Falha ao buscar saldo de futures do Gate.io', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
} 