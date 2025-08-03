"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONITORING_CONFIG = exports.MEXC_FUTURES_PAIRS = exports.GATEIO_FUTURES_PAIRS = exports.COMMON_PAIRS = exports.MEXC_PAIRS = exports.GATEIO_PAIRS = void 0;
exports.isValidPair = isValidPair;
exports.getMonitoredPairs = getMonitoredPairs;
exports.GATEIO_PAIRS = [
    '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
    'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
    'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'DADDY_USDT', 'DAG_USDT', 'DEGEN_USDT',
    'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT', 'WMTX_USDT', 'PIN_USDT',
    'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT', 'TARA_USDT', 'BERT_USDT',
    'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT', 'RBNT_USDT', 'TOMI_USDT',
    'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT', 'ALPINE_USDT', 'CITY_USDT',
    'ILV_USDT', 'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'SYS_USDT', 'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT',
    'LUNAI_USDT', 'MORE_USDT', 'MGO_USDT', 'GROK_USDT',
    'VANRY_USDT', 'EPIC_USDT', 'POLS_USDT', 'CLOUD_USDT', 'DGB_USDT', 'OG_USDT', 'FLM_USDT'
];
exports.MEXC_PAIRS = [
    '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
    'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
    'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'CUDIS_USDT', 'DADDY_USDT', 'DAG_USDT',
    'DEGEN_USDT', 'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'ENJ_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT',
    'WMTX_USDT', 'PIN_USDT', 'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT',
    'TARA_USDT', 'BERT_USDT', 'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT',
    'RBNT_USDT', 'TOMI_USDT', 'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT',
    'ALPINE_USDT', 'CITY_USDT', 'ILV_USDT', 'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'ALICE_USDT', 'SYS_USDT', 'PSG_USDT',
    'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT', 'REX_USDT', 'LUNAI_USDT', 'MORE_USDT', 'B_USDT', 'RED_USDT', 'GTC_USDT',
    'TALE_USDT', 'RWA_USDT', 'MGO_USDT', 'CESS_USDT', 'QUBIC_USDT', 'TEL_USDT', 'SHM_USDT', 'DOLO_USDT', 'LABUBU_USDT',
    'ZIG_USDT', 'BAR_USDT', 'GROK_USDT', 'MASA_USDT', 'XEM_USDT', 'ULTI_USDT', 'LUMIA_USDT', 'PONKE_USDT',
    'VANRY_USDT', 'EPIC_USDT', 'POLS_USDT', 'CLOUD_USDT', 'DGB_USDT', 'OG_USDT', 'FLM_USDT'
];
exports.COMMON_PAIRS = exports.GATEIO_PAIRS.filter(pair => exports.MEXC_PAIRS.includes(pair));
exports.GATEIO_FUTURES_PAIRS = exports.GATEIO_PAIRS.map(pair => pair.replace('_USDT', ':USDT'));
exports.MEXC_FUTURES_PAIRS = exports.MEXC_PAIRS.map(pair => pair.replace('_USDT', ':USDT'));
exports.MONITORING_CONFIG = {
    updateInterval: 5000,
    minSpreadThreshold: 0.01,
    maxSpreadThreshold: 50,
    priceValidation: {
        minPrice: 0.000001,
        maxPrice: 1000000,
    }
};
function isValidPair(symbol) {
    const normalizedSymbol = symbol.toUpperCase();
    return exports.COMMON_PAIRS.includes(normalizedSymbol);
}
function getMonitoredPairs() {
    return exports.COMMON_PAIRS;
}
//# sourceMappingURL=predefined-pairs.js.map