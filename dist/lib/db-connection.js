"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnection = void 0;
exports.executeQuery = executeQuery;
const pg_1 = require("pg");
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3b19GI5DHmL9x11Xd4I329vT@dpg-d1i63eqdbo4c7387d210-a/arbitragem_banco_bdx8';
const pool = new pg_1.Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    connectionTimeoutMillis: 60000,
    query_timeout: 60000,
    statement_timeout: 60000,
    idleTimeoutMillis: 30000,
    max: 5,
    min: 1
});
async function executeQuery(query, params) {
    var _a, _b;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(query, params);
                return result.rows;
            }
            finally {
                client.release();
            }
        }
        catch (error) {
            const isLastAttempt = attempt === maxRetries;
            const isConnectionError = error.code === 'ECONNRESET' ||
                ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('timeout')) ||
                ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('connection'));
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
exports.dbConnection = {
    async getSpreadHistory(limit = 100) {
        return executeQuery(`
      SELECT * FROM "SpreadHistory" 
      ORDER BY timestamp DESC 
      LIMIT $1
    `, [limit]);
    },
    async getSpreadHistoryCount() {
        var _a;
        const result = await executeQuery('SELECT COUNT(*) as count FROM "SpreadHistory"');
        return parseInt(((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || '0');
    },
    async getOperationHistory(limit = 100) {
        return executeQuery(`
      SELECT * FROM "OperationHistory" 
      ORDER BY "createdAt" DESC 
      LIMIT $1
    `, [limit]);
    },
    async getOperationHistoryCount() {
        var _a;
        const result = await executeQuery('SELECT COUNT(*) as count FROM "OperationHistory"');
        return parseInt(((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || '0');
    },
    async getManualBalances() {
        return executeQuery('SELECT * FROM "ManualBalance" ORDER BY "createdAt" DESC');
    },
    async getManualBalanceCount() {
        var _a;
        const result = await executeQuery('SELECT COUNT(*) as count FROM "ManualBalance"');
        return parseInt(((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || '0');
    },
    async getPositions() {
        return executeQuery('SELECT * FROM "Position" ORDER BY "createdAt" DESC');
    },
    async getPositionsCount() {
        var _a;
        const result = await executeQuery('SELECT COUNT(*) as count FROM "Position"');
        return parseInt(((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || '0');
    },
    async testConnection() {
        return executeQuery('SELECT 1 as test, NOW() as current_time');
    },
    async close() {
        await pool.end();
    },
    executeQuery
};
exports.default = exports.dbConnection;
//# sourceMappingURL=db-connection.js.map