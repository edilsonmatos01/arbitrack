const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSaveOpportunities() {
  try {
    console.log('🔍 Testando função saveOpportunities...');
    
    // Dados reais do WebSocket
    const testOpportunities = [
      {
        baseSymbol: 'WHITE',
        profitPercentage: 20.7592,
        buyAt: { exchange: 'gateio', price: 0.000382, marketType: 'spot' },
        sellAt: { exchange: 'mexc', price: 0.0004613, marketType: 'futures' },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      },
      {
        baseSymbol: 'PIN',
        profitPercentage: 0.8158,
        buyAt: { exchange: 'gateio', price: 0.8213, marketType: 'spot' },
        sellAt: { exchange: 'mexc', price: 0.828, marketType: 'futures' },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      }
    ];
    
    console.log('📝 Salvando oportunidades de teste...');
    
    for (const opportunity of testOpportunities) {
      try {
        await prisma.spreadHistory.create({
          data: {
            symbol: opportunity.baseSymbol,
            spread: opportunity.profitPercentage,
            spotPrice: opportunity.buyAt.price,
            futuresPrice: opportunity.sellAt.price,
            exchangeBuy: opportunity.buyAt.exchange,
            exchangeSell: opportunity.sellAt.exchange,
            direction: opportunity.arbitrageType,
            timestamp: new Date(opportunity.timestamp)
          }
        });
        console.log(`✅ ${opportunity.baseSymbol} salvo com sucesso (${opportunity.profitPercentage.toFixed(4)}%)`);
      } catch (error) {
        console.error(`❌ Erro ao salvar ${opportunity.baseSymbol}:`, error.message);
      }
    }
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSaveOpportunities(); 