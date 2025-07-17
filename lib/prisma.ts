import { PrismaClient } from '@prisma/client';
let prisma: PrismaClient | null = null;

try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configurações otimizadas para o pool de conexões
    log: ['error', 'warn'],
    // Configurações específicas para ambiente de produção
  });
} catch (error) {
  console.warn('Aviso: Não foi possível conectar ao banco de dados');
}

export default prisma; 