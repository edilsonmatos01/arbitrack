async function testFrontendMaxSpread() {
  console.log('🔍 Testando Frontend - Spread Máximo 24h...\n');
  
  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  
  for (const symbol of symbols) {
    try {
      console.log(`📊 Testando ${symbol}:`);
      
      // Teste 1: API de spread máximo (usada pelo MaxSpreadCell)
      const maxResponse = await fetch(`http://localhost:3000/api/spreads/${encodeURIComponent(symbol)}/max`);
      const maxData = await maxResponse.json();
      
      console.log(`  API Spread Máximo:`, maxData);
      
      if (maxData.spMax !== null && maxData.crosses >= 2) {
        console.log(`  ✅ Dados válidos encontrados`);
        console.log(`  📈 Spread máximo: ${maxData.spMax}%`);
        console.log(`  📊 Registros: ${maxData.crosses}`);
        
        // Verificar se o valor faz sentido
        if (maxData.spMax > 0 && maxData.spMax < 10) {
          console.log(`  ✅ Valor parece realista (entre 0% e 10%)`);
        } else {
          console.log(`  ⚠️  Valor pode estar incorreto: ${maxData.spMax}%`);
        }
      } else {
        console.log(`  ❌ Dados insuficientes ou nulos`);
        console.log(`  📊 Registros: ${maxData.crosses}`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Erro ao testar ${symbol}:`, error.message);
    }
  }
  
  console.log('🎯 Resumo:');
  console.log('- O componente MaxSpreadCell agora busca dados reais da API');
  console.log('- Não depende mais de valores passados como props');
  console.log('- Mostra "N/D" quando não há dados suficientes');
  console.log('- Cache de 5 minutos para performance');
}

testFrontendMaxSpread().catch(console.error); 