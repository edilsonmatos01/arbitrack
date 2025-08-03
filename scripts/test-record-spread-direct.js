const { recordSpread } = require('../dist/lib/spread-tracker');

async function testRecordSpreadDirect() {
  try {
    console.log('🔍 Testando recordSpread com dados reais...');
    
    // Dados reais do WebSocket
    const testOpportunities = [
      {
        symbol: 'WHITE',
        exchangeBuy: 'gateio',
        exchangeSell: 'mexc',
        direction: 'spot-to-future',
        spread: 18.60759493670886
      },
      {
        symbol: 'HOLD',
        exchangeBuy: 'gateio',
        exchangeSell: 'mexc',
        direction: 'spot-to-future',
        spread: 1.2472487160674885
      },
      {
        symbol: 'EDGE',
        exchangeBuy: 'gateio',
        exchangeSell: 'mexc',
        direction: 'spot-to-future',
        spread: 1.2694337469690313
      }
    ];
    
    console.log('📝 Salvando oportunidades de teste...');
    
    for (const opportunity of testOpportunities) {
      try {
        await recordSpread(opportunity);
        console.log(`✅ ${opportunity.symbol} salvo com sucesso (${opportunity.spread.toFixed(4)}%)`);
      } catch (error) {
        console.error(`❌ Erro ao salvar ${opportunity.symbol}:`, error.message);
      }
    }
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testRecordSpreadDirect(); 