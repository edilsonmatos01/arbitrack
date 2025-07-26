const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSaveOpportunitiesReal() {
  try {
    console.log('🔍 Testando saveOpportunities com dados reais do WebSocket...');
    
    // Dados reais do WebSocket (exatamente como recebidos)
    const realOpportunities = [
      {
        type: 'arbitrage',
        baseSymbol: 'WHITE',
        profitPercentage: 20.3723,
        buyAt: {
          exchange: 'gateio',
          price: 0.000376,
          marketType: 'spot'
        },
        sellAt: {
          exchange: 'mexc',
          price: 0.0004526,
          marketType: 'futures'
        },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      },
      {
        type: 'arbitrage',
        baseSymbol: 'PIN',
        profitPercentage: 0.7742,
        buyAt: {
          exchange: 'gateio',
          price: 0.8137,
          marketType: 'spot'
        },
        sellAt: {
          exchange: 'mexc',
          price: 0.82,
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
        console.log(`   - buyAt.price: ${opp.buyAt.price} (${typeof opp.buyAt.price})`);
        console.log(`   - sellAt.price: ${opp.sellAt.price} (${typeof opp.sellAt.price})`);
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
      console.log(`💾 Salvando: ${opportunity.baseSymbol}`);
      console.log(`   - spotPrice: ${opportunity.buyAt.price}`);
      console.log(`   - futuresPrice: ${opportunity.sellAt.price}`);
      console.log(`   - spread: ${opportunity.profitPercentage}`);
      
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
      console.log(`   - spotPrice salvo: ${savedRecord.spotPrice}`);
      console.log(`   - futuresPrice salvo: ${savedRecord.futuresPrice}`);
      console.log(`   - spread salvo: ${savedRecord.spread}%`);
      console.log(`   - timestamp salvo: ${savedRecord.timestamp}`);
      console.log('---');
    }
    
    console.log(`🎉 ${realOpportunitiesFiltered.length} oportunidades salvas com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar oportunidades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSaveOpportunitiesReal(); 