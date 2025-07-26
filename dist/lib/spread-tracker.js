"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.recordSpread = recordSpread;
exports.getAverageSpread24h = getAverageSpread24h;
exports.disconnectPrisma = disconnectPrisma;
const client_1 = require("@prisma/client");
const spreadUtils_1 = require("../app/utils/spreadUtils");
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: ['error'],
        errorFormat: 'minimal',
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
async function waitForDatabase(retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            await exports.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            if (i === retries - 1)
                throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
}
async function recordSpread(sample) {
    var _a;
    try {
        await waitForDatabase();
        const normalizedSpread = (0, spreadUtils_1.normalizeSpread)(sample.spread);
        if (normalizedSpread === null) {
            console.warn('Spread inválido, registro ignorado:', sample);
            return;
        }
        const tableExists = await exports.prisma.$queryRaw `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SpreadHistory'
      );
    `;
        if (!((_a = tableExists[0]) === null || _a === void 0 ? void 0 : _a.exists)) {
            console.error('Tabela spread_history não existe');
            return;
        }
        await exports.prisma.spreadHistory.create({
            data: {
                symbol: sample.symbol,
                exchangeBuy: sample.exchangeBuy,
                exchangeSell: sample.exchangeSell,
                direction: sample.direction,
                spread: parseFloat(normalizedSpread),
                spotPrice: sample.spotPrice || 0,
                futuresPrice: sample.futuresPrice || 0,
                timestamp: new Date()
            }
        });
    }
    catch (error) {
        console.error("Error recording spread:", error);
        throw error;
    }
}
async function getAverageSpread24h(symbol, exchangeBuy, exchangeSell, direction) {
    try {
        await waitForDatabase();
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const records = await exports.prisma.spreadHistory.findMany({
            where: {
                symbol,
                exchangeBuy,
                exchangeSell,
                direction,
                timestamp: { gte: since }
            },
            select: {
                spread: true
            }
        });
        if (records.length < 2)
            return null;
        const { Decimal } = require('decimal.js');
        const total = records.reduce((sum, r) => sum.plus(r.spread), new Decimal(0));
        const average = total.dividedBy(records.length);
        return parseFloat(average.toDecimalPlaces(2).toString());
    }
    catch (error) {
        console.error("Error getting average spread:", error);
        return null;
    }
}
async function disconnectPrisma() {
    await exports.prisma.$disconnect();
}
//# sourceMappingURL=spread-tracker.js.map