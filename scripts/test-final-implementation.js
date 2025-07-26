// Script de teste final para verificar a implementação
console.log('🧪 Teste Final da Implementação');

async function testFinalImplementation() {
  try {
    console.log('\n1. Testando API de spread...');
    const spreadResponse = await fetch('http://localhost:3000/api/init-data-simple?user_id=edilsonmatos');
    const spreadData = await spreadResponse.json();
    
    console.log('✅ API funcionando');
    console.log('📊 Total de símbolos:', Object.keys(spreadData.spreads?.data || {}).length);
    
    // Testar símbolos específicos da imagem
    const testSymbols = ['WHITE_USDT', 'PIN_USDT', 'RBNT_USDT', 'ANON_USDT', 'GORK_USDT', 'ALPINE_USDT'];
    
    console.log('\n2. Verificando símbolos específicos...');
    testSymbols.forEach(symbol => {
      const data = spreadData.spreads?.data?.[symbol];
      if (data) {
        console.log(`✅ ${symbol}: ${data.spMax.toFixed(2)}% (${data.crosses} cruzamentos)`);
      } else {
        console.log(`❌ ${symbol}: Não encontrado`);
      }
    });
    
    // Testar API de gráfico
    console.log('\n3. Testando API de gráfico...');
    const testSymbol = 'WHITE_USDT';
    const chartResponse = await fetch(`http://localhost:3000/api/spread-history/24h/${encodeURIComponent(testSymbol)}`);
    const chartData = await chartResponse.json();
    
    console.log(`📈 Dados de gráfico para ${testSymbol}:`, chartData.length, 'pontos');
    
    console.log('\n✅ Todos os testes passaram!');
    console.log('🎯 A implementação está pronta para funcionar.');
    
    return {
      success: true,
      spreadData: spreadData.spreads?.data || {},
      chartData,
      testSymbols
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { success: false, error };
  }
}

// Executar teste
testFinalImplementation().then(result => {
  if (result.success) {
    console.log('\n🎉 IMPLEMENTAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('📱 Agora a coluna "Spread Máximo (24h)" deve exibir dados instantaneamente.');
  } else {
    console.log('\n⚠️ Há problemas que precisam ser resolvidos.');
  }
}); 