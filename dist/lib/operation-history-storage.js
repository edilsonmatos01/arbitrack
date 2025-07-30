"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationHistoryStorage = void 0;
const isBrowser = typeof globalThis !== 'undefined' && 'window' in globalThis && 'localStorage' in globalThis;
const STORAGE_KEY = 'arbitrage_operation_history';
class OperationHistoryStorage {
    static saveOperation(operation) {
        try {
            if (!isBrowser) {
                console.warn('localStorage não disponível no servidor');
                return;
            }
            const existing = this.getAllOperations();
            existing.push(operation);
            const limited = existing.slice(-500);
            globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
            console.log('✅ Operação salva no localStorage:', operation.symbol);
        }
        catch (error) {
            console.error('❌ Erro ao salvar no localStorage:', error);
        }
    }
    static getAllOperations() {
        try {
            if (!isBrowser) {
                return [];
            }
            const stored = globalThis.localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        }
        catch (error) {
            console.error('❌ Erro ao carregar do localStorage:', error);
            return [];
        }
    }
    static deleteOperation(operationId) {
        try {
            if (!isBrowser) {
                console.warn('localStorage não disponível no servidor');
                return false;
            }
            const existing = this.getAllOperations();
            const filtered = existing.filter(op => op.id !== operationId);
            if (filtered.length === existing.length) {
                console.log('⚠️ Operação não encontrada no localStorage:', operationId);
                return false;
            }
            globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            console.log('✅ Operação excluída do localStorage:', operationId);
            return true;
        }
        catch (error) {
            console.error('❌ Erro ao excluir do localStorage:', error);
            return false;
        }
    }
    static getFilteredOperations(filter = '24h', startDate, endDate, symbol) {
        const allOperations = this.getAllOperations();
        let filtered = allOperations;
        if (symbol) {
            filtered = filtered.filter(op => op.symbol.toLowerCase().includes(symbol.toLowerCase()));
        }
        const now = new Date();
        switch (filter) {
            case '24h':
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                filtered = filtered.filter(op => new Date(op.finalizedAt) >= yesterday);
                break;
            case 'day':
                if (startDate) {
                    const dayStart = new Date(startDate);
                    dayStart.setHours(0, 0, 0, 0);
                    const dayEnd = new Date(startDate);
                    dayEnd.setHours(23, 59, 59, 999);
                    filtered = filtered.filter(op => {
                        const opDate = new Date(op.finalizedAt);
                        return opDate >= dayStart && opDate <= dayEnd;
                    });
                }
                break;
            case 'range':
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    filtered = filtered.filter(op => {
                        const opDate = new Date(op.finalizedAt);
                        return opDate >= start && opDate <= end;
                    });
                }
                break;
        }
        return filtered.slice(0, 100);
    }
    static clearAll() {
        try {
            if (!isBrowser) {
                console.warn('localStorage não disponível no servidor');
                return;
            }
            globalThis.localStorage.removeItem(STORAGE_KEY);
            console.log('✅ Todos os registros removidos do localStorage');
        }
        catch (error) {
            console.error('❌ Erro ao limpar localStorage:', error);
        }
    }
    static getStats() {
        const operations = this.getAllOperations();
        const totalOperations = operations.length;
        const totalProfit = operations.reduce((sum, op) => sum + op.profitLossUsd, 0);
        const averagePercent = totalOperations > 0
            ? operations.reduce((sum, op) => sum + op.profitLossPercent, 0) / totalOperations
            : 0;
        return { totalOperations, totalProfit, averagePercent };
    }
}
exports.OperationHistoryStorage = OperationHistoryStorage;
//# sourceMappingURL=operation-history-storage.js.map