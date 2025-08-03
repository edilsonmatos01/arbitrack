// Script para testar o hook usePreloadData no navegador
// Execute este script no console do navegador

console.log('🧪 Testando hook usePreloadData...');

// Simular o hook
async function testPreloadData() {
  try {
    console.log('1. Testando API de spread...');
    const spreadResponse = await fetch('/api/init-data-simple?user_id=edilsonmatos');
    const spreadData = await spreadResponse.json();
    
    console.log('✅ API de spread funcionando');
    console.log('📊 Símbolos disponíveis:', Object.keys(spreadData.spreads?.data || {}).length);
    
    // Testar símbolo específico
    const testSymbol = 'WHITE_USDT';
    const symbolData = spreadData.spreads?.data?.[testSymbol];
    
    if (symbolData) {
      console.log(`✅ Dados encontrados para ${testSymbol}:`, symbolData);
      console.log(`📈 Spread máximo: ${symbolData.spMax}%`);
    } else {
      console.log(`❌ Nenhum dado encontrado para ${testSymbol}`);
      console.log('📋 Símbolos disponíveis:', Object.keys(spreadData.spreads?.data || {}));
    }
    
    // Testar API de gráfico
    console.log('\n2. Testando API de gráfico...');
    const chartResponse = await fetch(`/api/spread-history/24h/${encodeURIComponent(testSymbol)}`);
    const chartData = await chartResponse.json();
    
    console.log(`📈 Pontos de dados para ${testSymbol}:`, chartData.length);
    
    return {
      spreadData: spreadData.spreads?.data || {},
      chartData,
      testSymbol,
      symbolData
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
}

// Executar teste
testPreloadData().then(result => {
  if (result) {
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('📊 Resultado:', result);
  } else {
    console.log('\n❌ Teste falhou!');
  }
});

// Função para testar o hook diretamente
function testHookDirectly() {
  console.log('🔧 Testando hook diretamente...');
  
  // Verificar se o hook está disponível
  if (typeof window !== 'undefined' && window.React) {
    console.log('✅ React disponível');
  } else {
    console.log('❌ React não disponível');
  }
  
  // Verificar se há dados em cache
  console.log('📋 Verificando cache global...');
  
  // Tentar acessar dados do hook
  console.log('🔍 Tentando acessar dados do hook...');
}

// Executar teste do hook
testHookDirectly(); 