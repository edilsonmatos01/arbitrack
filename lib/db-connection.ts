import { Pool } from 'pg';

// URL correta do banco que contém os dados
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3b19GI5DHmL9x11Xd4I329vT@dpg-d1i63eqdbo4c7387d210-a/arbitragem_banco_bdx8';

// Configuração específica para Render com SSL corrigido
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  connectionTimeoutMillis: 60000,
  query_timeout: 60000,
  statement_timeout: 60000,
  idleTimeoutMillis: 30000,
  max: 5, // Limitar pool para evitar sobrecarga
  min: 1
});

// Função para executar queries com retry
export async function executeQuery<T>(query: string, params?: any[]): Promise<T[]> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(query, params);
        return result.rows;
      } finally {
        client.release();
      }
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const isConnectionError = error.code === 'ECONNRESET' || 
                               error.message?.includes('timeout') ||
                               error.message?.includes('connection');
      
      if (isConnectionError && !isLastAttempt) {
        console.warn(`[DB] Tentativa ${attempt}/${maxRetries} falhou - Reconectando...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error(`Falha após ${maxRetries} tentativas`);
}

// Funções específicas para as tabelas
export const dbConnection = {
  // SpreadHistory
  async getSpreadHistory(limit = 100) {
    return executeQuery(`
      SELECT * FROM "SpreadHistory" 
      ORDER BY timestamp DESC 
      LIMIT $1
    `, [limit]);
  },
  
  async getSpreadHistoryCount() {
    const result = await executeQuery('SELECT COUNT(*) as count FROM "SpreadHistory"');
    return parseInt((result[0] as any)?.count || '0');
  },
  
  // OperationHistory
  async getOperationHistory(limit = 100) {
    return executeQuery(`
      SELECT * FROM "OperationHistory" 
      ORDER BY "createdAt" DESC 
      LIMIT $1
    `, [limit]);
  },
  
  async getOperationHistoryCount() {
    const result = await executeQuery('SELECT COUNT(*) as count FROM "OperationHistory"');
    return parseInt((result[0] as any)?.count || '0');
  },
  
  // ManualBalance
  async getManualBalances() {
    return executeQuery('SELECT * FROM "ManualBalance" ORDER BY "createdAt" DESC');
  },
  
  async getManualBalanceCount() {
    const result = await executeQuery('SELECT COUNT(*) as count FROM "ManualBalance"');
    return parseInt((result[0] as any)?.count || '0');
  },
  
  // Positions
  async getPositions() {
    return executeQuery('SELECT * FROM "Position" ORDER BY "createdAt" DESC');
  },
  
  async getPositionsCount() {
    const result = await executeQuery('SELECT COUNT(*) as count FROM "Position"');
    return parseInt((result[0] as any)?.count || '0');
  },
  
  // Teste de conexão
  async testConnection() {
    return executeQuery('SELECT 1 as test, NOW() as current_time');
  },
  
  // Fechar conexão
  async close() {
    await pool.end();
  },
  
  // Exportar executeQuery para uso direto
  executeQuery
};

export default dbConnection; 