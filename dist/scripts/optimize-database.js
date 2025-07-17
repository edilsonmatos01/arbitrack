"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
datasources: [object, Object];
db: {
    url: process.env.DATABASE_URL,
    ;
}
log: [error, ', ', warn, '],,
    async function optimizeDatabase() {
        try { }
        finally { }
        [object, Object];
        console.log('🔧 Otimizando configurações do banco de dados...);, await prisma.$connect());
        console.log(Conexão, com, banco, estabelecida, ');, console.log(Executando, VACUUM, ...');, await prisma.$executeRaw `VACUUM ANALYZE;`));
        console.log('✅ VACUUM concluído); );
        const spreadCount = await prisma.spreadHistory.count();
        const operationCount = await prisma.operationHistory.count();
        console.log(`📊 Estatísticas do banco:`);
        console.log(`   - SpreadHistory: ${spreadCount} registros`);
        console.log(`   - OperationHistory: ${operationCount} registros`);
        const recentSpreads = await prisma.spreadHistory.findMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5,
            console, : .log(`📈 Dados recentes (últimas 24h): ${recentSpreads.length} registros`),
            if(recentSpreads) { }, : .length > 0,
            console, : .log(Últimos, registros), recentSpreads, : .forEach((spread, index) => [object, Object], console.log(`   ${index + 1}. ${spread.symbol} - Spread: ${spread.spread}% - Spot: ${spread.spotPrice} - Futures: ${spread.futuresPrice}`))
        });
    }
];
try { }
catch (error) {
    console.error('❌ Erro ao otimizar banco:', error);
}
finally { }
[object, Object];
await prisma.$disconnect();
if (require.main === module) {
    optimizeDatabase();
}
exports.default = optimizeDatabase;
//# sourceMappingURL=optimize-database.js.map