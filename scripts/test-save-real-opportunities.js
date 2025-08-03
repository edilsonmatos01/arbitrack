const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSaveRealOpportunities() {
  try {
    console.log('🔍 Testando saveOpportunities com dados reais do WebSocket...');
    
    // Dados reais do WebSocket (exatamente como recebidos)
    const realOpportunities = [
      {
        type: 'arbitrage',
        baseSymbol: 'WHITE',
        profitPercentage: 18.594282717020715,
        buyAt: {
          exchange: 'gateio',
          price: 0.0003813,
          marketType: 'spot'
        },
        sellAt: {
          exchange: 'mexc',
          price: 0.0004522,
          marketType: 'futures'
        },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      },
      {
        type: 'arbitrage',
        baseSymbol: 'ALU',
        profitPercentage: 0.41128917883988625,
        buyAt: {
          exchange: 'gateio',
          price: 0.007051,
          marketType: 'spot'
        },
        sellAt: {
          exchange: 'mexc',
          price: 0.00708,
          marketType: 'futures'
        },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      },
      {
        type: 'arbitrage',
        baseSymbol: 'BRISE',
        profitPercentage: 0.46330615270570596,
        buyAt: {
          exchange: 'gateio',
          price: 5.396e-8,
          marketType: 'spot'
        },
        sellAt: {
          exchange: 'mexc',
          price: 5.421e-8,
          marketType: 'futures'
        },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      }
    ];
    
    console.log('📝 Testando validação de oportunidades...');
    
    // Simular a validação do worker
    const realOpportunitiesFiltered = realOpportunities.filter(opp => {
      // Rejeitar dados de teste
      if (opp.baseSymbol.includes('TEST') || opp.baseSymbol.includes('test')) {
        console.log(`❌ Rejeitando oportunidade de teste: ${opp.baseSymbol}`);
        return false;
      }
      // Validar preços reais
      if (opp.buyAt.price <= 0 || opp.sellAt.price <= 0) {
        console.log(`❌ Rejeitando oportunidade com preços inválidos: ${opp.baseSymbol}`);
        return false;
      }
      console.log(`✅ Oportunidade válida: ${opp.baseSymbol} - Spot: ${opp.buyAt.price}, Futures: ${opp.sellAt.price}`);
      return true;
    });
    
    if (realOpportunitiesFiltered.length === 0) {
      console.log('❌ Nenhuma oportunidade real para salvar');
      return;
    }
    
    console.log(`📊 Salvando ${realOpportunitiesFiltered.length} oportunidades no banco...`);
    
    // Salvar no banco (exatamente como o worker faz)
    for (const opportunity of realOpportunitiesFiltered) {
      const savedRecord = await prisma.spreadHistory.create({
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
      
      console.log(`✅ Salvo: ${opportunity.baseSymbol} - ID: ${savedRecord.id}`);
      console.log(`   - spotPrice: ${savedRecord.spotPrice}`);
      console.log(`   - futuresPrice: ${savedRecord.futuresPrice}`);
      console.log(`   - spread: ${savedRecord.spread}%`);
    }
    
    console.log(`🎉 ${realOpportunitiesFiltered.length} oportunidades salvas com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar oportunidades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSaveRealOpportunities(); 