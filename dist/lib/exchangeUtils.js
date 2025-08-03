"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFundingRateWithRetry = fetchFundingRateWithRetry;
const exchangeConfigs = {
    gateio: {
        ccxtId: 'gateio',
        fundingRateEndpoint: (symbol) => ({
            endpoint: 'swapPublicGetSettleFundingRate',
            params: { settle: 'usdt', contract: symbol.includes('_') ? symbol : symbol.replace('/', '_') }
        })
    },
    mexc: {
        ccxtId: 'mexc',
        fundingRateEndpoint: (symbol) => ({
            endpoint: 'swapPublicGetFundingRate',
            params: { contract: symbol.includes('_') ? symbol : symbol.replace('/', '_') }
        })
    }
};
async function fetchFundingRateWithRetry(symbol, exchange, projectExchangeId) {
    var _a;
    try {
        const config = exchangeConfigs[projectExchangeId];
        if (!config.fundingRateEndpoint) {
            return null;
        }
        const { endpoint, params } = config.fundingRateEndpoint(symbol);
        let rateData;
        switch (projectExchangeId) {
            case 'mexc':
                rateData = await exchange[endpoint](Object.assign(Object.assign({}, params), { contract: symbol.includes('_') ? symbol : symbol.replace('/', '_') }));
                return parseFloat(rateData.data.fundingRate);
            case 'gateio':
                rateData = await exchange[endpoint](Object.assign(Object.assign({}, params), { contract: symbol.includes('_') ? symbol : symbol.replace('/', '_') }));
                if (Array.isArray(rateData) && rateData.length > 0) {
                    const specificRate = rateData.find(r => r.contract === (symbol.includes('_') ? symbol : symbol.replace('/', '_')));
                    return parseFloat(specificRate ? specificRate.r : rateData[0].r);
                }
                return parseFloat(rateData.r);
            default:
                if (typeof exchange.fetchFundingRate === 'function') {
                    const genericRate = await exchange.fetchFundingRate(symbol);
                    return (_a = genericRate === null || genericRate === void 0 ? void 0 : genericRate.fundingRate) !== null && _a !== void 0 ? _a : null;
                }
                return null;
        }
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=exchangeUtils.js.map