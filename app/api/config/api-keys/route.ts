import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

// GET - Buscar configurações das exchanges
export async function GET(req: NextRequest) {
  try {
    let configs: any[] = [];
    
    try {
      // Tentar buscar do banco de dados usando Prisma
      const prisma = new PrismaClient();
      const result = await prisma.apiConfiguration.findMany({
        select: {
          id: true,
          exchange: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      await prisma.$disconnect();
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
    const prisma = new PrismaClient();
    const existingConfig = await prisma.apiConfiguration.findFirst({
      where: { exchange }
    });

    let config;
    if (existingConfig) {
      // Atualizar configuração existente
      const result = await prisma.apiConfiguration.update({
        where: { id: existingConfig.id },
        data: {
          apiKey: encryptedApiKey,
          apiSecret: encryptedApiSecret,
          passphrase: encryptedPassphrase,
          isActive,
          updatedAt: new Date()
        },
        select: {
          id: true,
          exchange: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
      config = result;
    } else {
      // Criar nova configuração
      const result = await prisma.apiConfiguration.create({
        data: {
          exchange,
          apiKey: encryptedApiKey,
          apiSecret: encryptedApiSecret,
          passphrase: encryptedPassphrase,
          isActive
        },
        select: {
          id: true,
          exchange: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
      config = result;
    }
    
    await prisma.$disconnect();

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

    const prisma = new PrismaClient();
    await prisma.apiConfiguration.deleteMany({
      where: { exchange }
    });
    await prisma.$disconnect();

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
    const prisma = new PrismaClient();
    const config = await prisma.apiConfiguration.findFirst({
      where: { 
        exchange,
        isActive: true
      }
    });
    await prisma.$disconnect();

    if (!config) {
      return null;
    }

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