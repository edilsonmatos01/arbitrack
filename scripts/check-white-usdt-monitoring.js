// Script para verificar se WHITE_USDT está sendo monitorada
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando se WHITE_USDT está sendo monitorada...');

// Ler o arquivo de pares predefinidos
const pairsFile = path.join(__dirname, '../lib/predefined-pairs.ts');
const content = fs.readFileSync(pairsFile, 'utf8');

// Verificar se WHITE_USDT está no conteúdo
const hasWhiteUsdt = content.includes('WHITE_USDT');
console.log(`✅ WHITE_USDT encontrada no arquivo: ${hasWhiteUsdt}`);

if (hasWhiteUsdt) {
  // Encontrar as linhas onde WHITE_USDT aparece
  const lines = content.split('\n');
  const whiteLines = [];
  
  lines.forEach((line, index) => {
    if (line.includes('WHITE_USDT')) {
      whiteLines.push({ line: index + 1, content: line.trim() });
    }
  });
  
  console.log(`\n📋 WHITE_USDT encontrada em ${whiteLines.length} linha(s):`);
  whiteLines.forEach(({ line, content }) => {
    console.log(`  Linha ${line}: ${content}`);
  });
  
  // Verificar se está nas listas corretas
  const inGateio = content.includes("'WHITE_USDT'") && content.includes('GATEIO_PAIRS');
  const inMexc = content.includes("'WHITE_USDT'") && content.includes('MEXC_PAIRS');
  
  console.log(`\n📊 Status nas listas:`);
  console.log(`  ✅ GATEIO_PAIRS: ${inGateio}`);
  console.log(`  ✅ MEXC_PAIRS: ${inMexc}`);
  
  if (inGateio && inMexc) {
    console.log(`\n🎉 WHITE_USDT está presente em ambas as listas e será monitorada!`);
  } else {
    console.log(`\n⚠️ WHITE_USDT pode não estar sendo monitorada corretamente.`);
  }
  
} else {
  console.log('❌ WHITE_USDT NÃO encontrada no arquivo!');
}

console.log('\n✅ Verificação concluída!'); 