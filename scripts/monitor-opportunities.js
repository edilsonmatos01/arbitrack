const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorOpportunities() {
  console.log('🔍 Monitorando oportunidades de arbitragem...');
  console.log('⏰ Verificando a cada 10 segundos...\n');
  
  let lastCount = 0;
  
  while (true) {
    try {
      // Busca oportunidades das últimas 24 horas
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const opportunities = await prisma.spreadHistory.findMany({
        where: {
          timestamp: { gte: since },
          exchangeBuy: 'gateio',
          exchangeSell: 'mexc',
          direction: 'spot-to-future'
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      });
      
      const totalCount = await prisma.spreadHistory.count({
        where: {
          timestamp: { gte: since },
          exchangeBuy: 'gateio',
          exchangeSell: 'mexc',
          direction: 'spot-to-future'
        }
      });
      
      const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      if (totalCount > lastCount) {
        console.log(`\n📊 [${now}] NOVAS OPORTUNIDADES ENCONTRADAS!`);
        console.log(`📈 Total nas últimas 24h: ${totalCount} (${totalCount - lastCount} novas)`);
        
        // Mostra as últimas oportunidades
        opportunities.slice(0, 5).forEach(opp => {
          const time = new Date(opp.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          console.log(`  💰 ${opp.symbol}: ${opp.spread.toFixed(4)}% (${time})`);
        });
        
        lastCount = totalCount;
      } else {
        console.log(`[${now}] Monitorando... Total: ${totalCount}`);
      }
      
      // Verifica se há dados recentes (últimos 5 minutos)
      const recentSince = new Date(Date.now() - 5 * 60 * 1000);
      const recentCount = await prisma.spreadHistory.count({
        where: {
          timestamp: { gte: recentSince },
          exchangeBuy: 'gateio',
          exchangeSell: 'mexc',
          direction: 'spot-to-future'
        }
      });
      
      if (recentCount === 0) {
        console.log('⚠️  Nenhuma oportunidade recente (últimos 5 min)');
      }
      
    } catch (error) {
      console.error('❌ Erro ao monitorar:', error.message);
    }
    
    // Aguarda 10 segundos
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

// Tratamento de shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Parando monitor...');
  await prisma.$disconnect();
  process.exit(0);
});

monitorOpportunities().catch(console.error); 