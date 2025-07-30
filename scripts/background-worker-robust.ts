import { PrismaClient } from '@prisma/client';
import { setTimeout } from 'timers/promises';

// Configuração robusta do Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

// Circuit breaker para evitar spam de conexões
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 30000; // 30 segundos

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        console.log('[CircuitBreaker] Tentando recuperação...');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log(`[CircuitBreaker] Circuito ABERTO após ${this.failures} falhas`);
    }
  }
}

const circuitBreaker = new CircuitBreaker();

// Função robusta para gravar spread com retry
async function recordSpreadRobust(spreadData: any): Promise<void> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 segundo

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await circuitBreaker.execute(async () => {
        await prisma.spreadHistory.create({
          data: spreadData
        });
      });
      
      // Sucesso - sair do loop
      return;
      
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const isDatabaseError = error.message?.includes('FATAL') || 
                             error.message?.includes('starting up') ||
                             error.message?.includes('not yet accepting');
      
      if (isDatabaseError) {
        console.warn(`[Worker] Tentativa ${attempt}/${maxRetries} falhou - Banco instável:`, error.message);
        
        if (!isLastAttempt) {
          // Backoff exponencial
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`[Worker] Aguardando ${delay}ms antes da próxima tentativa...`);
          await setTimeout(delay);
        }
      } else {
        // Erro não relacionado ao banco - não tentar novamente
        console.error(`[Worker] Erro não relacionado ao banco:`, error.message);
        break;
      }
    }
  }
  
  console.error(`[Worker] Falha ao gravar spread após ${maxRetries} tentativas`);
}

// Função para verificar saúde do banco
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await circuitBreaker.execute(async () => {
      await prisma.$queryRaw`SELECT 1`;
    });
    return true;
  } catch (error) {
    console.warn('[HealthCheck] Banco não está saudável:', error);
    return false;
  }
}

// Função principal do worker com health check
async function robustWorker() {
  console.log('[Worker] Iniciando worker robusto...');
  
  while (true) {
    try {
      // Verificar saúde do banco antes de processar
      const isHealthy = await checkDatabaseHealth();
      
      if (!isHealthy) {
        console.log('[Worker] Banco não está saudável, aguardando 30 segundos...');
        await setTimeout(30000);
        continue;
      }
      
      // Aqui você colocaria sua lógica de coleta de dados
      // Por exemplo:
      // const opportunities = await fetchArbitrageOpportunities();
      // for (const opp of opportunities) {
      //   await recordSpreadRobust({
      //     symbol: opp.symbol,
      //     spread: opp.spread,
      //     // ... outros campos
      //   });
      // }
      
      // Aguardar antes da próxima iteração
      await setTimeout(5000); // 5 segundos
      
    } catch (error) {
      console.error('[Worker] Erro geral:', error);
      await setTimeout(10000); // 10 segundos em caso de erro
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Worker] Encerrando worker...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] Encerrando worker...');
  await prisma.$disconnect();
  process.exit(0);
});

// Iniciar worker
robustWorker().catch(console.error); 