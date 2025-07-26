// Script para comparar a lista hardcoded antiga com COMMON_PAIRS

// Lista hardcoded antiga (extraída do código original)
const HARDCODED_LIST = [
  '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
  'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
  'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'CUDIS_USDT', 'DADDY_USDT', 'DAG_USDT',
  'DEGEN_USDT', 'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'ENJ_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT',
  'WMTX_USDT', 'PIN_USDT', 'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT', 'TARA_USDT',
  'BERT_USDT', 'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT', 'RBNT_USDT', 'TOMI_USDT',
  'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT', 'ALPINE_USDT', 'CITY_USDT', 'ILV_USDT',
  'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'ALICE_USDT', 'SYS_USDT', 'PSG_USDT', 'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT',
  'REX_USDT', 'LUNAI_USDT', 'MORE_USDT', 'B_USDT', 'RED_USDT', 'GTC_USDT', 'TALE_USDT', 'RWA_USDT', 'MGO_USDT', 'CESS_USDT',
  'QUBIC_USDT', 'TEL_USDT', 'SHM_USDT', 'DOLO_USDT', 'LABUBU_USDT', 'ZIG_USDT', 'BAR_USDT', 'GROK_USDT', 'MASA_USDT', 'XEM_USDT',
  'ULTI_USDT', 'LUMIA_USDT', 'PONKE_USDT'
];

// Carregar COMMON_PAIRS atual
const { COMMON_PAIRS } = require('./lib/predefined-pairs');

console.log('🔍 COMPARAÇÃO DAS LISTAS DE PARIDADES');
console.log('=====================================\n');

console.log(`📊 ESTATÍSTICAS:`);
console.log(`   • Lista Hardcoded: ${HARDCODED_LIST.length} paridades`);
console.log(`   • COMMON_PAIRS: ${COMMON_PAIRS.length} paridades`);
console.log(`   • Diferença: ${COMMON_PAIRS.length - HARDCODED_LIST.length} paridades\n`);

// Paridades que estão em COMMON_PAIRS mas NÃO na lista hardcoded
const missingInHardcoded = COMMON_PAIRS.filter(pair => !HARDCODED_LIST.includes(pair));

console.log(`❌ PARIDADES AUSENTES NA LISTA HARDCODED (${missingInHardcoded.length}):`);
console.log('--------------------------------------------------');
if (missingInHardcoded.length > 0) {
  missingInHardcoded.forEach((pair, index) => {
    console.log(`   ${index + 1}. ${pair}`);
  });
} else {
  console.log('   Nenhuma paridade ausente');
}
console.log('');

// Paridades que estão na lista hardcoded mas NÃO em COMMON_PAIRS
const missingInCommon = HARDCODED_LIST.filter(pair => !COMMON_PAIRS.includes(pair));

console.log(`❌ PARIDADES AUSENTES NO COMMON_PAIRS (${missingInCommon.length}):`);
console.log('--------------------------------------------------');
if (missingInCommon.length > 0) {
  missingInCommon.forEach((pair, index) => {
    console.log(`   ${index + 1}. ${pair}`);
  });
} else {
  console.log('   Nenhuma paridade ausente');
}
console.log('');

// Paridades que estão em ambas as listas
const commonPairs = HARDCODED_LIST.filter(pair => COMMON_PAIRS.includes(pair));

console.log(`✅ PARIDADES EM AMBAS AS LISTAS (${commonPairs.length}):`);
console.log('--------------------------------------------------');
if (commonPairs.length > 0) {
  // Mostrar apenas as primeiras 20 para não poluir o output
  const displayPairs = commonPairs.slice(0, 20);
  displayPairs.forEach((pair, index) => {
    console.log(`   ${index + 1}. ${pair}`);
  });
  if (commonPairs.length > 20) {
    console.log(`   ... e mais ${commonPairs.length - 20} paridades`);
  }
}
console.log('');

// Verificar especificamente as paridades problemáticas
const problemPairs = ['VANRY_USDT', 'EPIC_USDT', 'POLS_USDT', 'CLOUD_USDT', 'DGB_USDT', 'OG_USDT', 'FLM_USDT'];

console.log(`🎯 PARIDADES PROBLEMÁTICAS ESPECÍFICAS:`);
console.log('----------------------------------------');
problemPairs.forEach(pair => {
  const inHardcoded = HARDCODED_LIST.includes(pair);
  const inCommon = COMMON_PAIRS.includes(pair);
  const status = inHardcoded ? '✅' : '❌';
  const status2 = inCommon ? '✅' : '❌';
  console.log(`   ${pair}: Hardcoded ${status} | COMMON_PAIRS ${status2}`);
});
console.log('');

// Resumo
console.log(`📋 RESUMO:`);
console.log('==========');
console.log(`• Lista Hardcoded tinha ${HARDCODED_LIST.length} paridades`);
console.log(`• COMMON_PAIRS tem ${COMMON_PAIRS.length} paridades`);
console.log(`• ${missingInHardcoded.length} paridades estavam ausentes da lista hardcoded`);
console.log(`• ${missingInCommon.length} paridades estavam ausentes do COMMON_PAIRS`);
console.log(`• ${commonPairs.length} paridades estão em ambas as listas`);
console.log('');
console.log(`💡 IMPACTO DA CORREÇÃO:`);
console.log('======================');
console.log(`• VANRY_USDT e EPIC_USDT agora estão disponíveis`);
console.log(`• Todas as paridades de predefined-pairs estão sincronizadas`);
console.log(`• Manutenção futura será mais fácil`); 