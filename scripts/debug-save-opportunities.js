const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSaveOpportunities() {
  try {
    console.log('🔍 Debugando função saveOpportunities...');
    
    // Dados reais do WebSocket (exatamente como recebidos)
    const testOpportunities = [
      {
        type: 'arbitrage',
        baseSymbol: 'WHITE',
        profitPercentage: 20.2926,
        buyAt: {
          exchange: 'gateio',
          price: 0.0003828,
          marketType: 'spot'
        },
        sellAt: {
          exchange: 'mexc',
          price: 0.0004523,
          marketType: 'futures'
        },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      },
      {
        type: 'arbitrage',
        baseSymbol: 'DEAI',
        profitPercentage: 0.4823,
        buyAt: {
          exchange: 'gateio',
          price: 0.04976,
          marketType: 'spot'
        },
        sellAt: {
          exchange: 'mexc',
          price: 0.05,
          marketType: 'futures'
        },
        arbitrageType: 'spot_to_futures',
        timestamp: Date.now()
      }
    ];
    
    console.log('📝 Testando validação de oportunidades...');
    console.log('Dados de entrada:', JSON.stringify(testOpportunities, null, 2));
    
    // Simular a validação do worker
    const realOpportunities = testOpportunities.filter(opp => {
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
    
    if (realOpportunities.length === 0) {
      console.log('❌ Nenhuma oportunidade real para salvar');
      return;
    }
    
    console.log(`📊 Salvando ${realOpportunities.length} oportunidades no banco...`);
    
    // Salvar no banco (exatamente como o worker faz)
    for (const opportunity of realOpportunities) {
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
    
    console.log(`🎉 ${realOpportunities.length} oportunidades salvas com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar oportunidades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSaveOpportunities(); 