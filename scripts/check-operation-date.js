const { PrismaClient } = require('@prisma/client');

async function checkOperationDate() {
  const prisma = new PrismaClient();
  
  try {
    const operation = await prisma.operationHistory.findFirst({
      orderBy: { finalizedAt: 'desc' }
    });
    
    if (operation) {
      const operationDate = new Date(operation.finalizedAt);
      const now = new Date();
      const diffHours = (now - operationDate) / (1000 * 60 * 60);
      
      console.log('📅 Data da operação:', operationDate.toISOString());
      console.log('📅 Data atual:', now.toISOString());
      console.log('⏰ Diferença em horas:', diffHours.toFixed(2));
      console.log('📊 Operação:', operation.symbol, '- $' + operation.profitLossUsd);
      
      if (diffHours > 24) {
        console.log('⚠️ A operação tem mais de 24 horas!');
        console.log('💡 Por isso não aparece no filtro de 24h do dashboard');
      } else {
        console.log('✅ Operação está dentro das últimas 24h');
      }
    } else {
      console.log('❌ Nenhuma operação encontrada');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOperationDate(); 