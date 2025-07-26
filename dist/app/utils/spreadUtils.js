"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSpread = calculateSpread;
exports.normalizeSpread = normalizeSpread;
exports.formatValue = formatValue;
exports.compareSpread = compareSpread;
exports.isValidSpread = isValidSpread;
const decimal_js_1 = __importDefault(require("decimal.js"));
function calculateSpread(sellPrice, buyPrice) {
    try {
        const sell = new decimal_js_1.default(sellPrice.toString().trim());
        const buy = new decimal_js_1.default(buyPrice.toString().trim());
        if (buy.isZero() || buy.isNegative() || sell.isNegative() ||
            !buy.isFinite() || !sell.isFinite() ||
            buy.equals(0) || sell.equals(0)) {
            return null;
        }
        if (sell.equals(buy)) {
            return "0.0000";
        }
        const difference = sell.minus(buy);
        const ratio = difference.dividedBy(buy);
        const percentageSpread = ratio.times(100);
        if (!percentageSpread.isFinite()) {
            return null;
        }
        return percentageSpread.toDecimalPlaces(4, decimal_js_1.default.ROUND_HALF_UP).toString();
    }
    catch (error) {
        console.error('Erro ao calcular spread:', error);
        return null;
    }
}
function normalizeSpread(spread) {
    try {
        const decimalSpread = new decimal_js_1.default(spread.toString());
        if (decimalSpread.isNegative() || decimalSpread.isZero() || !decimalSpread.isFinite()) {
            return null;
        }
        return decimalSpread.toDecimalPlaces(2).toString();
    }
    catch (error) {
        console.error('Erro ao normalizar spread:', error);
        return null;
    }
}
function formatValue(value, minDecimals = 2, maxDecimals = 8) {
    try {
        const decimal = new decimal_js_1.default(value.toString().trim());
        const stringValue = decimal.toString();
        const decimalPart = stringValue.split('.')[1] || '';
        const significantDecimals = Math.min(Math.max(decimalPart.length, minDecimals), maxDecimals);
        return decimal.toDecimalPlaces(significantDecimals, decimal_js_1.default.ROUND_HALF_UP).toString();
    }
    catch (_a) {
        return '0';
    }
}
function compareSpread(a, b) {
    if (a === null && b === null)
        return 0;
    if (a === null)
        return -1;
    if (b === null)
        return 1;
    try {
        const decimalA = new decimal_js_1.default(a.trim());
        const decimalB = new decimal_js_1.default(b.trim());
        return decimalA.comparedTo(decimalB);
    }
    catch (_a) {
        return 0;
    }
}
function isValidSpread(spread) {
    if (!spread)
        return false;
    try {
        const value = new decimal_js_1.default(spread.trim());
        return !value.isNegative() && value.isFinite() && !value.isZero();
    }
    catch (_a) {
        return false;
    }
}
//# sourceMappingURL=spreadUtils.js.map