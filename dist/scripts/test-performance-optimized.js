"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPerformance = testPerformance;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testPerformance() {
    console.log('🚀 Iniciando testes de performance...\n');
    const tests = [
        {
            name: 'Consulta de spread history por símbolo (24h)',
            query: async () => {
                const start = Date.now();
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const result = await prisma.spreadHistory.findMany({
                    where: {
                        symbol: 'BTC_USDT',
                        timestamp: {
                            gte: twentyFourHoursAgo
                        }
                    },
                    select: {
                        timestamp: true,
                        spread: true
                    },
                    orderBy: {
                        timestamp: 'asc'
                    },
                    take: 10000
                });
                const end = Date.now();
                return { time: end - start, count: result.length };
            },
            expectedTime: 100
        },
        {
            name: 'Consulta agregada de spread máximo (24h)',
            query: async () => {
                const start = Date.now();
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const result = await prisma.spreadHistory.groupBy({
                    by: ['symbol'],
                    where: {
                        timestamp: {
                            gte: twentyFourHoursAgo
                        }
                    },
                    _max: { spread: true },
                    _min: { spread: true },
                    _count: { id: true }
                });
                const end = Date.now();
                return { time: end - start, count: result.length };
            },
            expectedTime: 200
        },
        {
            name: 'Consulta de posições por usuário',
            query: async () => {
                const start = Date.now();
                const result = await prisma.position.findMany({
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                const end = Date.now();
                return { time: end - start, count: result.length };
            },
            expectedTime: 50
        },
        {
            name: 'Consulta de spread history com filtros múltiplos',
            query: async () => {
                const start = Date.now();
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const result = await prisma.spreadHistory.findMany({
                    where: {
                        symbol: { in: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'] },
                        timestamp: {
                            gte: twentyFourHoursAgo
                        },
                        spread: {
                            gt: 0.5
                        }
                    },
                    select: {
                        symbol: true,
                        timestamp: true,
                        spread: true,
                        exchangeBuy: true,
                        exchangeSell: true
                    },
                    orderBy: {
                        spread: 'desc'
                    },
                    take: 100
                });
                const end = Date.now();
                return { time: end - start, count: result.length };
            },
            expectedTime: 150
        },
        {
            name: 'Consulta de estatísticas por exchange',
            query: async () => {
                const start = Date.now();
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const result = await prisma.spreadHistory.groupBy({
                    by: ['exchangeBuy', 'exchangeSell'],
                    where: {
                        timestamp: {
                            gte: twentyFourHoursAgo
                        }
                    },
                    _avg: { spread: true },
                    _max: { spread: true },
                    _count: { id: true }
                });
                const end = Date.now();
                return { time: end - start, count: result.length };
            },
            expectedTime: 300
        }
    ];
    let totalTime = 0;
    let passedTests = 0;
    let totalTests = tests.length;
    console.log('📊 Executando testes de performance:\n');
    for (const test of tests) {
        try {
            console.log(`🔍 Testando: ${test.name}`);
            const iterations = 3;
            let totalTestTime = 0;
            let totalCount = 0;
            for (let i = 0; i < iterations; i++) {
                const result = await test.query();
                totalTestTime += result.time;
                totalCount += result.count;
            }
            const avgTime = Math.round(totalTestTime / iterations);
            const avgCount = Math.round(totalCount / iterations);
            const status = test.expectedTime ?
                (avgTime <= test.expectedTime ? '✅' : '⚠️') : '✅';
            const performance = test.expectedTime ?
                `${Math.round((test.expectedTime / avgTime) * 100)}% da performance esperada` :
                'Sem benchmark definido';
            console.log(`   ${status} Tempo médio: ${avgTime}ms | Registros: ${avgCount} | ${performance}`);
            if (avgTime <= (test.expectedTime || Infinity)) {
                passedTests++;
            }
            totalTime += avgTime;
        }
        catch (error) {
            console.log(`   ❌ Erro: ${error instanceof Error ? error.message : String(error)}`);
        }
        console.log('');
    }
    console.log('🔥 Teste de carga - Múltiplas requisições simultâneas:');
    try {
        const concurrentRequests = 10;
        const start = Date.now();
        const promises = Array.from({ length: concurrentRequests }, () => prisma.spreadHistory.findMany({
            where: {
                symbol: 'BTC_USDT',
                timestamp: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            take: 1000
        }));
        const results = await Promise.all(promises);
        const end = Date.now();
        const totalTimeConcurrent = end - start;
        const avgTimePerRequest = Math.round(totalTimeConcurrent / concurrentRequests);
        const totalRecords = results.reduce((sum, result) => sum + result.length, 0);
        console.log(`   ✅ ${concurrentRequests} requisições simultâneas em ${totalTimeConcurrent}ms`);
        console.log(`   📊 Tempo médio por requisição: ${avgTimePerRequest}ms`);
        console.log(`   📊 Total de registros retornados: ${totalRecords}`);
        if (avgTimePerRequest <= 200) {
            passedTests++;
            totalTests++;
        }
    }
    catch (error) {
        console.log(`   ❌ Erro no teste de carga: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log('\n📋 Resumo dos testes:');
    console.log(`   ✅ Testes aprovados: ${passedTests}/${totalTests}`);
    console.log(`   ⏱️  Tempo total médio: ${Math.round(totalTime)}ms`);
    console.log(`   📊 Performance geral: ${Math.round((passedTests / totalTests) * 100)}%`);
    if (passedTests === totalTests) {
        console.log('\n🎉 Todos os testes de performance passaram!');
        console.log('🚀 O sistema está otimizado e pronto para produção.');
    }
    else {
        console.log('\n⚠️  Alguns testes não atingiram a performance esperada.');
        console.log('🔧 Considere revisar as otimizações do banco de dados.');
    }
    console.log('\n📊 Estatísticas do banco de dados:');
    try {
        const totalRecords = await prisma.spreadHistory.count();
        const recentRecords = await prisma.spreadHistory.count({
            where: {
                timestamp: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });
        const uniqueSymbols = await prisma.spreadHistory.groupBy({
            by: ['symbol'],
            _count: { symbol: true }
        });
        console.log(`   📈 Total de registros: ${totalRecords.toLocaleString()}`);
        console.log(`   ⏰ Registros das últimas 24h: ${recentRecords.toLocaleString()}`);
        console.log(`   💱 Símbolos únicos: ${uniqueSymbols.length}`);
    }
    catch (error) {
        console.log(`   ❌ Erro ao obter estatísticas: ${error instanceof Error ? error.message : String(error)}`);
    }
}
if (require.main === module) {
    testPerformance()
        .then(() => {
        console.log('\n🎉 Testes de performance concluídos!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n💥 Erro fatal:', error);
        process.exit(1);
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
//# sourceMappingURL=test-performance-optimized.js.map