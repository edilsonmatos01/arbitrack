const fetch = require('node-fetch');

async function testFrontendSimple() {
  try {
    console.log('Testando frontend simples...');
    
    // Testar se a página carrega
    const response = await fetch('http://localhost:10000/arbitragem');
    console.log('Status da página:', response.status);
    
    if (response.ok) {
      const html = await response.text();
      console.log('✅ Página carregou com sucesso');
      
      // Verificar se há elementos importantes
      const hasTable = html.includes('<table');
      const hasMaxSpread = html.includes('Spread Máximo');
      const hasN_D = html.includes('N/D');
      
      console.log('Elementos encontrados:', {
        hasTable,
        hasMaxSpread,
        hasN_D
      });
      
      // Verificar se há dados de arbitragem
      const hasArbitrageData = html.includes('arbitrage');
      console.log('Dados de arbitragem:', hasArbitrageData);
      
    } else {
      console.error('❌ Erro ao carregar página:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFrontendSimple(); 