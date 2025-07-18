import { NextRequest, NextResponse } from 'next/server';
import dbConnection from '@/lib/db-connection';
import { encrypt, decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

// GET - Buscar configurações das exchanges
export async function GET(req: NextRequest) {
  try {
    let configs: any[] = [];
    
    try {
      // Tentar buscar do banco de dados usando conexão direta
      const result = await dbConnection.executeQuery(`
        SELECT id, exchange, "isActive", "createdAt", "updatedAt"
        FROM "ApiConfiguration"
        ORDER BY "createdAt" DESC
      `);
      configs = result;
    } catch (dbError: any) {
      console.warn('Banco de dados não disponível, usando variáveis de ambiente:', dbError.message);
    }

    // Se não há configurações no banco, verificar variáveis de ambiente
    if (configs.length === 0) {
      const envConfigs: any[] = [];
      const exchanges = ['gateio', 'mexc', 'binance', 'bybit', 'bitget'];
      
      for (const exchange of exchanges) {
        const apiKey = process.env[`${exchange.toUpperCase()}_API_KEY`];
        const apiSecret = process.env[`${exchange.toUpperCase()}_API_SECRET`];
        
        if (apiKey && apiSecret) {
          envConfigs.push({
            id: `env-${exchange}`,
            exchange: exchange,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'environment'
          });
        }
      }
      
      configs = envConfigs;
    }

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar ou atualizar configuração
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      console.error('Erro ao fazer parse do JSON:', jsonError);
      return NextResponse.json({ error: 'JSON inválido fornecido' }, { status: 400 });
    }

    const { exchange, apiKey, apiSecret, passphrase, isActive = true } = body;

    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Exchange, API Key e API Secret são obrigatórios' }, { status: 400 });
    }

    // Validar exchange
    const supportedExchanges = ['gateio', 'mexc', 'binance', 'bybit', 'bitget'];
    if (!supportedExchanges.includes(exchange)) {
      return NextResponse.json({ 
        error: `Exchange deve ser uma das seguintes: ${supportedExchanges.join(', ')}` 
      }, { status: 400 });
    }

    // Criptografar as chaves
    const encryptedApiKey = encrypt(apiKey);
    const encryptedApiSecret = encrypt(apiSecret);
    const encryptedPassphrase = passphrase ? encrypt(passphrase) : null;

    // Verificar se já existe configuração para esta exchange
    const existingConfig = await dbConnection.executeQuery(
      'SELECT * FROM "ApiConfiguration" WHERE exchange = $1',
      [exchange]
    );

    let config;
    if (existingConfig.length > 0) {
      // Atualizar configuração existente
      const result = await dbConnection.executeQuery(`
        UPDATE "ApiConfiguration" 
        SET "apiKey" = $1, "apiSecret" = $2, "passphrase" = $3, "isActive" = $4, "updatedAt" = NOW()
        WHERE exchange = $5
        RETURNING id, exchange, "isActive", "createdAt", "updatedAt"
      `, [encryptedApiKey, encryptedApiSecret, encryptedPassphrase, isActive, exchange]);
      config = result[0];
    } else {
      // Criar nova configuração
      const result = await dbConnection.executeQuery(`
        INSERT INTO "ApiConfiguration" (exchange, "apiKey", "apiSecret", "passphrase", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, exchange, "isActive", "createdAt", "updatedAt"
      `, [exchange, encryptedApiKey, encryptedApiSecret, encryptedPassphrase, isActive]);
      config = result[0];
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Remover configuração
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exchange = searchParams.get('exchange');

    if (!exchange) {
      return NextResponse.json({ error: 'Exchange é obrigatório' }, { status: 400 });
    }

    await dbConnection.executeQuery(
      'DELETE FROM "ApiConfiguration" WHERE exchange = $1',
      [exchange]
    );

    return NextResponse.json({ message: 'Configuração removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover configuração:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função utilitária para obter credenciais descriptografadas (para uso interno)
export async function getApiCredentials(exchange: string): Promise<{
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
} | null> {
  try {
    const configs = await dbConnection.executeQuery(
      'SELECT * FROM "ApiConfiguration" WHERE exchange = $1 AND "isActive" = true',
      [exchange]
    );

    if (configs.length === 0) {
      return null;
    }

    const config = configs[0] as any;
    return {
      apiKey: decrypt(config.apiKey),
      apiSecret: decrypt(config.apiSecret),
      passphrase: config.passphrase ? decrypt(config.passphrase) : undefined
    };
  } catch (error) {
    console.error('Erro ao obter credenciais:', error);
    return null;
  }
} 