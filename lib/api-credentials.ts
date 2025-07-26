import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './crypto';

export async function getApiCredentials(exchange: string): Promise<{
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
} | null> {
  try {
    const prisma = new PrismaClient();
    const config = await prisma.apiConfiguration.findFirst({
      where: { 
        exchange: exchange.toLowerCase(),
        isActive: true 
      }
    });
    await prisma.$disconnect();

    if (!config) {
      // Tentar buscar das variáveis de ambiente
      const apiKey = process.env[`${exchange.toUpperCase()}_API_KEY`];
      const apiSecret = process.env[`${exchange.toUpperCase()}_API_SECRET`];
      const passphrase = process.env[`${exchange.toUpperCase()}_PASSPHRASE`];

      if (apiKey && apiSecret) {
        return {
          apiKey,
          apiSecret,
          passphrase
        };
      }
      return null;
    }

    // Descriptografar as credenciais
    const decryptedApiKey = decrypt(config.apiKey);
    const decryptedApiSecret = decrypt(config.apiSecret);
    const decryptedPassphrase = config.passphrase ? decrypt(config.passphrase) : undefined;

    return {
      apiKey: decryptedApiKey,
      apiSecret: decryptedApiSecret,
      passphrase: decryptedPassphrase
    };
  } catch (error) {
    console.error(`Erro ao obter credenciais para ${exchange}:`, error);
    return null;
  }
} 