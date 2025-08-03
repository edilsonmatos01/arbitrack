-- Script para limpar dados com mais de 24 horas
-- Execute este comando no Beekeeper Studio

-- 1. Primeiro, vamos ver quantos registros serão deletados
SELECT 
    COUNT(*) as total_registros_antigos,
    MIN(timestamp) as data_mais_antiga,
    MAX(timestamp) as data_mais_recente
FROM "SpreadHistory" 
WHERE timestamp < NOW() - INTERVAL '24 hours';

-- 2. Deletar registros com mais de 24 horas
DELETE FROM "SpreadHistory" 
WHERE timestamp < NOW() - INTERVAL '24 hours';

-- 3. Verificar quantos registros restaram
SELECT 
    COUNT(*) as total_registros_restantes,
    MIN(timestamp) as data_mais_antiga_restante,
    MAX(timestamp) as data_mais_recente_restante
FROM "SpreadHistory";

-- 4. Verificar os últimos 10 registros para confirmar
SELECT 
    id,
    symbol,
    spread,
    spotPrice,
    futuresPrice,
    timestamp,
    exchangeBuy,
    exchangeSell
FROM "SpreadHistory" 
ORDER BY timestamp DESC 
LIMIT 10; 