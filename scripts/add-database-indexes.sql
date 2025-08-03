-- Script para adicionar índices ao banco de dados para melhorar performance
-- Execute este script no seu banco PostgreSQL

-- Índice para consultas por símbolo e timestamp (SpreadHistory)
CREATE INDEX IF NOT EXISTS idx_spreadhistory_symbol_timestamp 
ON "SpreadHistory" (symbol, timestamp);

-- Índice para consultas por timestamp apenas
CREATE INDEX IF NOT EXISTS idx_spreadhistory_timestamp 
ON "SpreadHistory" (timestamp);

-- Índice para consultas por símbolo apenas
CREATE INDEX IF NOT EXISTS idx_spreadhistory_symbol 
ON "SpreadHistory" (symbol);

-- Índice para consultas com filtros de preço
CREATE INDEX IF NOT EXISTS idx_spreadhistory_prices 
ON "SpreadHistory" (symbol, timestamp) 
WHERE spotPrice > 0 AND futuresPrice > 0;

-- Índice para OperationHistory por data de finalização
CREATE INDEX IF NOT EXISTS idx_operationhistory_finalizedat 
ON "OperationHistory" (finalizedAt);

-- Índice para OperationHistory por símbolo
CREATE INDEX IF NOT EXISTS idx_operationhistory_symbol 
ON "OperationHistory" (symbol);

-- Índice composto para OperationHistory
CREATE INDEX IF NOT EXISTS idx_operationhistory_symbol_finalizedat 
ON "OperationHistory" (symbol, finalizedAt);

-- Verificar se os índices foram criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('SpreadHistory', 'OperationHistory')
ORDER BY tablename, indexname; 