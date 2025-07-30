-- Script para aplicar índices otimizados no banco de dados
-- Execute este script para melhorar drasticamente a performance das consultas

-- Índices para a tabela SpreadHistory (mais crítica)
CREATE INDEX IF NOT EXISTS idx_spread_history_symbol_timestamp 
ON "SpreadHistory" (symbol, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_spread_history_timestamp 
ON "SpreadHistory" ("timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_spread_history_symbol 
ON "SpreadHistory" (symbol);

CREATE INDEX IF NOT EXISTS idx_spread_history_exchange 
ON "SpreadHistory" (exchange);

CREATE INDEX IF NOT EXISTS idx_spread_history_symbol_exchange_timestamp 
ON "SpreadHistory" (symbol, exchange, "timestamp" DESC);

-- Índices para a tabela Spread (se existir)
CREATE INDEX IF NOT EXISTS idx_spread_symbol_timestamp 
ON "Spread" (symbol, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_spread_timestamp 
ON "Spread" ("timestamp" DESC);

-- Índices para a tabela OperationHistory
CREATE INDEX IF NOT EXISTS idx_operation_history_timestamp 
ON "OperationHistory" ("timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_operation_history_symbol 
ON "OperationHistory" (symbol);

CREATE INDEX IF NOT EXISTS idx_operation_history_type 
ON "OperationHistory" (type);

-- Índices para a tabela Position (se existir)
CREATE INDEX IF NOT EXISTS idx_position_symbol 
ON "Position" (symbol);

CREATE INDEX IF NOT EXISTS idx_position_status 
ON "Position" (status);

CREATE INDEX IF NOT EXISTS idx_position_timestamp 
ON "Position" ("timestamp" DESC);

-- Otimizações adicionais do PostgreSQL
-- Configurar work_mem para consultas complexas
SET work_mem = '256MB';

-- Configurar shared_buffers (se possível)
-- SET shared_buffers = '256MB';

-- Configurar effective_cache_size (se possível)
-- SET effective_cache_size = '1GB';

-- Configurar random_page_cost
SET random_page_cost = 1.1;

-- Configurar effective_io_concurrency
SET effective_io_concurrency = 200;

-- Análise das tabelas para otimizar estatísticas
ANALYZE "SpreadHistory";
ANALYZE "Spread";
ANALYZE "OperationHistory";
ANALYZE "Position";

-- Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('SpreadHistory', 'Spread', 'OperationHistory', 'Position')
ORDER BY tablename, indexname; 