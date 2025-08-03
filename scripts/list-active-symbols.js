const { PrismaClient } = require('@prisma/client');

async function listActiveSymbols() {
  const prisma = new PrismaClient();
  try {
    const symbols = await prisma.tradableSymbol.findMany({
      where: { isActive: true },
      select: {
        baseSymbol: true,
        gateioSymbol: true,
        mexcFuturesSymbol: true
      }
    });
    if (symbols.length === 0) {
      console.log('Nenhum par ativo encontrado.');
      return;
    }
    console.log('Lista de paridades monitoradas (ATIVAS):\n');
    symbols.forEach(s => {
      console.log(`- ${s.baseSymbol} | Gate.io: ${s.gateioSymbol} | MEXC Futures: ${s.mexcFuturesSymbol}`);
    });
  } catch (error) {
    console.error('Erro ao consultar o banco:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listActiveSymbols(); 