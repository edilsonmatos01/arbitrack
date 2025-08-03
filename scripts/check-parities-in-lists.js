const fs = require('fs');
const path = require('path');

// Paridades que precisam ser verificadas
const TARGET_PAIRS = ['VANRY_USDT', 'EPIC_USDT'];

console.log('🔍 VERIFICANDO PARIDADES NAS LISTAS');
console.log('====================================\n');

// 1. Verificar predefined-pairs
console.log('1️⃣ VERIFICANDO predefined-pairs:');
console.log('--------------------------------');

try {
  const predefinedPairsPath = path.join(__dirname, '../lib/predefined-pairs.ts');
  const predefinedContent = fs.readFileSync(predefinedPairsPath, 'utf8');
  
  console.log('📁 Arquivo: lib/predefined-pairs.ts');
  
  TARGET_PAIRS.forEach(pair => {
    const isInGateio = predefinedContent.includes(`'${pair}'`);
    const isInMexc = predefinedContent.includes(`'${pair}'`);
    const isInCommon = predefinedContent.includes(`'${pair}'`);
    
    console.log(`   ${pair}:`);
    console.log(`     Gate.io: ${isInGateio ? '✅' : '❌'}`);
    console.log(`     MEXC: ${isInMexc ? '✅' : '❌'}`);
    console.log(`     Common: ${isInCommon ? '✅' : '❌'}`);
  });
  
  // Extrair listas para análise
  const gateioMatch = predefinedContent.match(/export const GATEIO_PAIRS = \[([\s\S]*?)\];/);
  const mexcMatch = predefinedContent.match(/export const MEXC_PAIRS = \[([\s\S]*?)\];/);
  
  if (gateioMatch) {
    const gateioPairs = gateioMatch[1].split(',').map(p => p.trim().replace(/'/g, ''));
    console.log(`\n📊 Total Gate.io: ${gateioPairs.length} pares`);
  }
  
  if (mexcMatch) {
    const mexcPairs = mexcMatch[1].split(',').map(p => p.trim().replace(/'/g, ''));
    console.log(`📊 Total MEXC: ${mexcPairs.length} pares`);
  }
  
} catch (error) {
  console.log('❌ Erro ao ler predefined-pairs.ts:', error.message);
}

// 2. Verificar STATIC_PAIRS
console.log('\n2️⃣ VERIFICANDO STATIC_PAIRS:');
console.log('----------------------------');

try {
  const workerPath = path.join(__dirname, '../worker/background-worker.ts');
  const workerContent = fs.readFileSync(workerPath, 'utf8');
  
  console.log('📁 Arquivo: worker/background-worker.ts');
  
  TARGET_PAIRS.forEach(pair => {
    const isInStatic = workerContent.includes(`'${pair}'`);
    console.log(`   ${pair}: ${isInStatic ? '✅' : '❌'}`);
  });
  
  // Extrair STATIC_PAIRS para análise
  const staticMatch = workerContent.match(/const STATIC_PAIRS = \[([\s\S]*?)\];/);
  if (staticMatch) {
    const staticPairs = staticMatch[1].split(',').map(p => p.trim().replace(/'/g, ''));
    console.log(`\n📊 Total STATIC_PAIRS: ${staticPairs.length} pares`);
  }
  
} catch (error) {
  console.log('❌ Erro ao ler background-worker.ts:', error.message);
}

// 3. Verificar endpoints (APIs)
console.log('\n3️⃣ VERIFICANDO ENDPOINTS (APIs):');
console.log('---------------------------------');

const apiFiles = [
  '../app/api/gateio/arbitrage-opportunities/route.ts',
  '../app/api/mexc/arbitrage-opportunities/route.ts',
  '../app/api/arbitrage/inter-exchange/route.ts'
];

apiFiles.forEach(apiFile => {
  try {
    const apiPath = path.join(__dirname, apiFile);
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    
    console.log(`\n📁 Arquivo: ${apiFile}`);
    
    TARGET_PAIRS.forEach(pair => {
      const isInApi = apiContent.includes(pair);
      console.log(`   ${pair}: ${isInApi ? '✅' : '❌'}`);
    });
    
    // Verificar se há TARGET_PAIRS definido
    const targetPairsMatch = apiContent.match(/const TARGET_PAIRS = \[([\s\S]*?)\];/);
    if (targetPairsMatch) {
      const targetPairs = targetPairsMatch[1].split(',').map(p => p.trim().replace(/'/g, ''));
      console.log(`   📊 Total TARGET_PAIRS: ${targetPairs.length} pares`);
    }
    
  } catch (error) {
    console.log(`❌ Erro ao ler ${apiFile}:`, error.message);
  }
});

// 4. Verificar outros arquivos importantes
console.log('\n4️⃣ VERIFICANDO OUTROS ARQUIVOS:');
console.log('--------------------------------');

const otherFiles = [
  '../src/gateio-connector.ts',
  '../src/mexc-connector.ts',
  '../components/arbitragem/arbitrage-table.tsx'
];

otherFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n📁 Arquivo: ${file}`);
    
    TARGET_PAIRS.forEach(pair => {
      const isInFile = fileContent.includes(pair);
      console.log(`   ${pair}: ${isInFile ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.log(`❌ Erro ao ler ${file}:`, error.message);
  }
});

// 5. Resumo final
console.log('\n📋 RESUMO FINAL:');
console.log('================');

TARGET_PAIRS.forEach(pair => {
  console.log(`\n🔍 ${pair}:`);
  
  // Verificar em cada fonte
  const sources = [
    { name: 'predefined-pairs.ts', path: '../lib/predefined-pairs.ts' },
    { name: 'STATIC_PAIRS', path: '../worker/background-worker.ts' },
    { name: 'Gate.io API', path: '../app/api/gateio/arbitrage-opportunities/route.ts' },
    { name: 'MEXC API', path: '../app/api/mexc/arbitrage-opportunities/route.ts' },
    { name: 'Inter-exchange API', path: '../app/api/arbitrage/inter-exchange/route.ts' }
  ];
  
  sources.forEach(source => {
    try {
      const filePath = path.join(__dirname, source.path);
      const content = fs.readFileSync(filePath, 'utf8');
      const isPresent = content.includes(pair);
      console.log(`   ${source.name}: ${isPresent ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ${source.name}: ❌ (erro ao ler arquivo)`);
    }
  });
});

console.log('\n💡 RECOMENDAÇÕES:');
console.log('=================');
console.log('• Se uma paridade não está nas listas, ela não será monitorada');
console.log('• Para adicionar uma paridade, inclua-a em:');
console.log('  - lib/predefined-pairs.ts (GATEIO_PAIRS e MEXC_PAIRS)');
console.log('  - worker/background-worker.ts (STATIC_PAIRS)');
console.log('  - APIs relevantes (TARGET_PAIRS)');
console.log('• Após adicionar, faça deploy para o Render'); 