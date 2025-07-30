import { PrismaClient } from '@prisma/client';

// URL correta do banco que contém os dados
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

// Configuração específica para Render com timeout
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL + '?sslmode=require&connect_timeout=60&application_name=arbitragem',
    },
  },
  log: ['error', 'warn'],
});

// Função para verificar se a conexão está ativa
async function checkConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('[Prisma] Conexão perdida, tentando reconectar...');
    return false;
  }
}

// Função robusta para executar queries com retry
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar conexão antes de executar
      const isConnected = await checkConnection();
      if (!isConnected) {
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      return await operation();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const isConnectionError = error.code === 'P1017' || 
                               error.message?.includes('Server has closed') ||
                               error.message?.includes('connection') ||
                               error.message?.includes('timeout');
      
      if (isConnectionError && !isLastAttempt) {
        console.warn(`[Prisma] Tentativa ${attempt}/${maxRetries} falhou - Reconectando...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error(`Falha após ${maxRetries} tentativas`);
}

export default prisma; 