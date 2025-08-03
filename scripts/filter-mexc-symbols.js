const fs = require('fs');

try {
  // Ler o arquivo de contratos
  const data = JSON.parse(fs.readFileSync('mexc_contracts.json', 'utf8'));
  
  // Filtrar apenas símbolos que terminam com _USDT
  const usdtSymbols = data.data
    .filter(c => c.symbol && c.symbol.endsWith('_USDT'))
    .map(c => c.symbol)
    .sort();
  
  // Salvar em arquivo
  fs.writeFileSync('mexc_usdt_symbols.txt', usdtSymbols.join('\n'));
  
  console.log('✅ Símbolos USDT encontrados:', usdtSymbols.length);
  console.log('📁 Arquivo salvo: mexc_usdt_symbols.txt');
  console.log('\n🔍 Primeiros 10 símbolos:');
  usdtSymbols.slice(0, 10).forEach((symbol, index) => {
    console.log(`${index + 1}. ${symbol}`);
  });
  
  // Verificar se DODO_USDT existe
  const hasDODO = usdtSymbols.includes('DODO_USDT');
  console.log(`\n❓ DODO_USDT encontrado: ${hasDODO ? '✅ SIM' : '❌ NÃO'}`);
  
  if (!hasDODO) {
    console.log('\n🔍 Símbolos similares a DODO:');
    const similarDODO = usdtSymbols.filter(s => s.includes('DODO'));
    if (similarDODO.length > 0) {
      similarDODO.forEach(s => console.log(`  - ${s}`));
    } else {
      console.log('  Nenhum símbolo similar encontrado');
    }
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
} 