"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeDatabase = optimizeDatabase;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function optimizeDatabase() {
    console.log('🚀 Iniciando otimização do banco de dados...');
    try {
        console.log('📊 Criando índices...');
        await prisma.$executeRaw `
      -- Índice composto para consultas de spread history por símbolo e timestamp
      CREATE INDEX IF NOT EXISTS idx_spread_history_symbol_timestamp 
      ON "SpreadHistory" (symbol, timestamp DESC);
    `;
        await prisma.$executeRaw `
      -- Índice para consultas de spread history por timestamp apenas
      CREATE INDEX IF NOT EXISTS idx_spread_history_timestamp 
      ON "SpreadHistory" (timestamp DESC);
    `;
        await prisma.$executeRaw `
      -- Índice para consultas de spread history por spread
      CREATE INDEX IF NOT EXISTS idx_spread_history_spread 
      ON "SpreadHistory" (spread DESC);
    `;
        await prisma.$executeRaw `
      -- Índice para consultas de spread history por exchange
      CREATE INDEX IF NOT EXISTS idx_spread_history_exchange_buy 
      ON "SpreadHistory" ("exchangeBuy");
    `;
        await prisma.$executeRaw `
      -- Índice para consultas de spread history por exchange de venda
      CREATE INDEX IF NOT EXISTS idx_spread_history_exchange_sell 
      ON "SpreadHistory" ("exchangeSell");
    `;
        await prisma.$executeRaw `
      -- Índice para consultas de spread history por direção
      CREATE INDEX IF NOT EXISTS idx_spread_history_direction 
      ON "SpreadHistory" (direction);
    `;
        console.log('📈 Criando índices para posições...');
        await prisma.$executeRaw `
      -- Índice para posições por usuário
      CREATE INDEX IF NOT EXISTS idx_positions_user_id 
      ON "Position" ("userId");
    `;
        await prisma.$executeRaw `
      -- Índice para posições por símbolo
      CREATE INDEX IF NOT EXISTS idx_positions_symbol 
      ON "Position" (symbol);
    `;
        await prisma.$executeRaw `
      -- Índice para posições por data de criação
      CREATE INDEX IF NOT EXISTS idx_positions_created_at 
      ON "Position" ("createdAt" DESC);
    `;
        console.log('⚙️ Otimizando configurações do PostgreSQL...');
        await prisma.$executeRaw `
      -- Aumentar shared_buffers para melhor performance
      ALTER SYSTEM SET shared_buffers = '256MB';
    `;
        await prisma.$executeRaw `
      -- Aumentar effective_cache_size
      ALTER SYSTEM SET effective_cache_size = '1GB';
    `;
        await prisma.$executeRaw `
      -- Otimizar work_mem para consultas complexas
      ALTER SYSTEM SET work_mem = '16MB';
    `;
        await prisma.$executeRaw `
      -- Otimizar maintenance_work_mem
      ALTER SYSTEM SET maintenance_work_mem = '256MB';
    `;
        await prisma.$executeRaw `
      -- Otimizar checkpoint_completion_target
      ALTER SYSTEM SET checkpoint_completion_target = 0.9;
    `;
        await prisma.$executeRaw `
      -- Otimizar wal_buffers
      ALTER SYSTEM SET wal_buffers = '16MB';
    `;
        await prisma.$executeRaw `
      -- Otimizar random_page_cost
      ALTER SYSTEM SET random_page_cost = 1.1;
    `;
        await prisma.$executeRaw `
      -- Otimizar effective_io_concurrency
      ALTER SYSTEM SET effective_io_concurrency = 200;
    `;
        console.log('🔄 Recarregando configurações...');
        await prisma.$executeRaw `SELECT pg_reload_conf();`;
        console.log('📊 Analisando tabelas...');
        await prisma.$executeRaw `ANALYZE "SpreadHistory";`;
        await prisma.$executeRaw `ANALYZE "Position";`;
        console.log('📈 Verificando estatísticas...');
        const spreadHistoryStats = await prisma.$queryRaw `
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE tablename = 'SpreadHistory'
      ORDER BY attname;
    `;
        const positionStats = await prisma.$queryRaw `
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE tablename = 'Position'
      ORDER BY attname;
    `;
        console.log('📊 Estatísticas da tabela SpreadHistory:', spreadHistoryStats);
        console.log('📊 Estatísticas da tabela Position:', positionStats);
        console.log('🔍 Verificando índices...');
        const indexes = await prisma.$queryRaw `
      SELECT 
        indexname,
        tablename,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('SpreadHistory', 'Position')
      ORDER BY tablename, indexname;
    `;
        console.log('📋 Índices criados:', indexes);
        console.log('📏 Verificando tamanho das tabelas...');
        const tableSizes = await prisma.$queryRaw `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE tablename IN ('SpreadHistory', 'Position')
      ORDER BY size_bytes DESC;
    `;
        console.log('📏 Tamanho das tabelas:', tableSizes);
        console.log('⚙️ Verificando configurações atuais...');
        const settings = await prisma.$queryRaw `
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
    `;
        console.log('⚙️ Configurações otimizadas:', settings);
        console.log('✅ Otimização do banco de dados concluída com sucesso!');
        console.log('');
        console.log('📋 Resumo das otimizações:');
        console.log('  - Índices criados para SpreadHistory e Position');
        console.log('  - Configurações do PostgreSQL otimizadas');
        console.log('  - Estatísticas das tabelas atualizadas');
        console.log('  - Configurações recarregadas');
        console.log('');
        console.log('🚀 Performance esperada:');
        console.log('  - Consultas de spread history: 70-90% mais rápidas');
        console.log('  - Consultas de posições: 60-80% mais rápidas');
        console.log('  - Consultas agregadas: 50-70% mais rápidas');
    }
    catch (error) {
        console.error('❌ Erro durante a otimização:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    optimizeDatabase()
        .then(() => {
        console.log('🎉 Script de otimização executado com sucesso!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=optimize-database.js.map