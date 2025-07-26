"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vacuumDatabase = vacuumDatabase;
exports.cleanupOldData = cleanupOldData;
exports.setupCronJobs = setupCronJobs;
const client_1 = require("@prisma/client");
const node_cron_1 = __importDefault(require("node-cron"));
const prisma = new client_1.PrismaClient();
async function vacuumDatabase() {
    try {
        console.log('🧹 Iniciando VACUUM do banco de dados...');
        const startTime = Date.now();
        await prisma.$executeRaw `VACUUM "SpreadHistory"`;
        console.log('✅ VACUUM SpreadHistory concluído');
        await prisma.$executeRaw `VACUUM "PriceHistory"`;
        console.log('✅ VACUUM PriceHistory concluído');
        console.log('ℹ️ OperationHistory preservada (histórico de operações)');
        await prisma.$executeRaw `VACUUM "Position"`;
        console.log('✅ VACUUM Position concluído');
        const duration = Date.now() - startTime;
        console.log(`🎉 VACUUM concluído em ${duration}ms`);
        const tableSizes = await prisma.$queryRaw `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;
        console.log('📊 Tamanho das tabelas após VACUUM:', tableSizes);
    }
    catch (error) {
        console.error('❌ Erro ao executar VACUUM:', error);
    }
}
async function cleanupOldData() {
    try {
        console.log('🗑️ Iniciando limpeza de dados antigos (mantendo apenas últimas 24h)...');
        const deletedSpreads = await prisma.spreadHistory.deleteMany({
            where: {
                timestamp: {
                    lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });
        const deletedPrices = await prisma.priceHistory.deleteMany({
            where: {
                timestamp: {
                    lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });
        console.log(`🗑️ Removidos ${deletedSpreads.count} spreads com mais de 24h`);
        console.log(`🗑️ Removidos ${deletedPrices.count} preços com mais de 24h`);
        console.log('ℹ️ OperationHistory preservada (histórico de operações mantido)');
        await vacuumDatabase();
    }
    catch (error) {
        console.error('❌ Erro ao limpar dados antigos:', error);
    }
}
function setupCronJobs() {
    console.log('⏰ Configurando jobs de limpeza...');
    node_cron_1.default.schedule('0 3 * * *', async () => {
        console.log('🌅 Executando VACUUM diário...');
        await vacuumDatabase();
    });
    node_cron_1.default.schedule('0 2 * * *', async () => {
        console.log('🧹 Executando limpeza diária (mantendo apenas últimas 24h)...');
        await cleanupOldData();
    });
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        console.log('🕐 Executando VACUUM a cada 6 horas...');
        await vacuumDatabase();
    });
    console.log('✅ Jobs de limpeza configurados');
}
if (require.main === module) {
    console.log('🚀 Iniciando script de VACUUM...');
    vacuumDatabase()
        .then(() => {
        console.log('✅ Script concluído');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Erro:', error);
        process.exit(1);
    });
}
else {
    setupCronJobs();
}
//# sourceMappingURL=vacuum-database.js.map