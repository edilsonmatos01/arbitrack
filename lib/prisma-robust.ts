import { PrismaClient } from '@prisma/client';

// Configuração robusta do Prisma para Render
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

// Configuração de pool limitado para evitar sobrecarga
const poolConfig = {
  pool: {
    min: 1,
    max: 5, // Limite baixo para evitar sobrecarga
    acquireTimeoutMillis: 30000, // 30 segundos
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000, // 30 segundos
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
};

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
                               error.message?.includes('connection');
      
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

// Wrapper para operações do Prisma
export const robustPrisma = {
  spreadHistory: {
    create: (data: any) => executeWithRetry(() => prisma.spreadHistory.create(data)),
    findMany: (params: any) => executeWithRetry(() => prisma.spreadHistory.findMany(params)),
    count: (params?: any) => executeWithRetry(() => prisma.spreadHistory.count(params)),
    deleteMany: (params: any) => executeWithRetry(() => prisma.spreadHistory.deleteMany(params)),
  },
  $queryRaw: (query: any) => executeWithRetry(() => prisma.$queryRaw(query)),
  $executeRaw: (query: any) => executeWithRetry(() => prisma.$executeRaw(query)),
  $disconnect: () => prisma.$disconnect(),
};

export default prisma; 