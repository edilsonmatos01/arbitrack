-- 🚀 Script de Otimização do Banco de Dados
-- Execute este script no seu banco PostgreSQL para aplicar as otimizações

-- 1. Criar índices para melhorar performance das consultas
-- ========================================================

-- Índice composto para consultas de spread history por símbolo e timestamp
CREATE INDEX IF NOT EXISTS idx_spread_history_symbol_timestamp 
ON "SpreadHistory" (symbol, timestamp DESC);

-- Índice para consultas de spread history por timestamp apenas
CREATE INDEX IF NOT EXISTS idx_spread_history_timestamp 
ON "SpreadHistory" (timestamp DESC);

-- Índice para consultas de spread history por spread
CREATE INDEX IF NOT EXISTS idx_spread_history_spread 
ON "SpreadHistory" (spread DESC);

-- Índice para consultas de spread history por exchange de compra
CREATE INDEX IF NOT EXISTS idx_spread_history_exchange_buy 
ON "SpreadHistory" ("exchangeBuy");

-- Índice para consultas de spread history por exchange de venda
CREATE INDEX IF NOT EXISTS idx_spread_history_exchange_sell 
ON "SpreadHistory" ("exchangeSell");

-- Índice para consultas de spread history por direção
CREATE INDEX IF NOT EXISTS idx_spread_history_direction 
ON "SpreadHistory" (direction);

-- Índices para a tabela de posições
CREATE INDEX IF NOT EXISTS idx_positions_symbol 
ON "Position" (symbol);

CREATE INDEX IF NOT EXISTS idx_positions_created_at 
ON "Position" ("createdAt" DESC);

-- 2. Otimizar configurações do PostgreSQL
-- =======================================

-- Aumentar shared_buffers para melhor performance
ALTER SYSTEM SET shared_buffers = '256MB';

-- Aumentar effective_cache_size
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Otimizar work_mem para consultas complexas
ALTER SYSTEM SET work_mem = '16MB';

-- Otimizar maintenance_work_mem
ALTER SYSTEM SET maintenance_work_mem = '256MB';

-- Otimizar checkpoint_completion_target
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- Otimizar wal_buffers
ALTER SYSTEM SET wal_buffers = '16MB';

-- Otimizar random_page_cost
ALTER SYSTEM SET random_page_cost = 1.1;

-- Otimizar effective_io_concurrency
ALTER SYSTEM SET effective_io_concurrency = 200;

-- 3. Recarregar configurações
-- ===========================
SELECT pg_reload_conf();

-- 4. Analisar tabelas para otimizar estatísticas
-- ==============================================
ANALYZE "SpreadHistory";
ANALYZE "Position";

-- 5. Verificar índices criados
-- ============================
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('SpreadHistory', 'Position')
ORDER BY tablename, indexname;

-- 6. Verificar tamanho das tabelas
-- ================================
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE tablename IN ('SpreadHistory', 'Position')
ORDER BY size_bytes DESC;

-- 7. Verificar configurações atuais
-- =================================
SELECT 
  name,
  setting,
  unit
FROM pg_settings 
WHERE name IN (
  'shared_buffers',
  'effective_cache_size',
  'work_mem',
  'maintenance_work_mem',
  'checkpoint_completion_target',
  'wal_buffers',
  'random_page_cost',
  'effective_io_concurrency'
)
ORDER BY name;

-- 8. Estatísticas das tabelas
-- ===========================
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'SpreadHistory'
ORDER BY attname;

SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'Position'
ORDER BY attname;

-- 9. Comandos úteis para monitoramento
-- ====================================

-- Verificar uso de índices
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('SpreadHistory', 'Position')
ORDER BY idx_scan DESC;

-- Verificar estatísticas de tabelas
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables 
WHERE tablename IN ('SpreadHistory', 'Position')
ORDER BY tablename;

-- Verificar tamanho dos índices
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes 
WHERE tablename IN ('SpreadHistory', 'Position')
ORDER BY pg_relation_size(indexrelid) DESC;

-- 10. Comandos para limpeza (opcional)
-- ====================================

-- VACUUM para liberar espaço e atualizar estatísticas
VACUUM ANALYZE "SpreadHistory";
VACUUM ANALYZE "Position";

-- Verificar fragmentação
SELECT 
  schemaname,
  tablename,
  n_dead_tup,
  n_live_tup,
  round(n_dead_tup * 100.0 / nullif(n_live_tup + n_dead_tup, 0), 2) as dead_percentage
FROM pg_stat_user_tables 
WHERE tablename IN ('SpreadHistory', 'Position')
ORDER BY dead_percentage DESC;

-- Comentários sobre as otimizações
-- ================================

/*
🎯 RESULTADOS ESPERADOS:

1. Consultas de spread history: 70-90% mais rápidas
2. Consultas de posições: 60-80% mais rápidas  
3. Consultas agregadas: 50-70% mais rápidas
4. Melhor utilização de memória do PostgreSQL
5. Redução de I/O do disco
6. Estatísticas mais precisas para o query planner

⚠️  IMPORTANTE:

- Execute este script em horário de baixo tráfego
- Faça backup antes de executar
- Monitore a performance após as mudanças
- Ajuste as configurações conforme necessário para seu ambiente

📊 MONITORAMENTO:

- Verifique os logs do PostgreSQL após as mudanças
- Monitore o uso de memória e CPU
- Acompanhe os tempos de resposta das consultas
- Verifique se os índices estão sendo utilizados corretamente
*/ 