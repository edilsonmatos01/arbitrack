const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSaveRealData() {
  try {
    console.log('🔍 Testando saveOpportunities com dados reais...');
    
    // Dados reais do WebSocket
    const realOpportunities = [
      {
        baseSymbol: 'WHITE',
        profitPercentage: 18.12805348418616,
        buyAt: { exchange: 'gateio', price: 0.0003889, marketType: 'spot' },
        sellAt: { exchange: 'mexc', price: 0.0004594, marketType: 'futures' },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      },
      {
        baseSymbol: 'VR',
        profitPercentage: 0.6269592476488995,
        buyAt: { exchange: 'gateio', price: 0.003509, marketType: 'spot' },
        sellAt: { exchange: 'mexc', price: 0.003531, marketType: 'futures' },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      },
      {
        baseSymbol: 'MAT',
        profitPercentage: 0.4273504273504277,
        buyAt: { exchange: 'gateio', price: 0.351, marketType: 'spot' },
        sellAt: { exchange: 'mexc', price: 0.3525, marketType: 'futures' },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      }
    ];
    
    console.log('📝 Salvando oportunidades reais...');
    
    for (const opportunity of realOpportunities) {
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

testSaveRealData(); 