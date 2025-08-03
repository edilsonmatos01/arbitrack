const { PrismaClient } = require('@prisma/client');

console.log('📊 INSERINDO DADOS DE TESTE DE SPREAD');
console.log('=====================================');

async function insertTestData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔗 Conectando ao banco...');
    await prisma.$connect();
    console.log('✅ Conectado ao banco!');
    
    // Símbolos que aparecem na tabela
    const symbols = [
      'WHITE', 'DAG', 'PIN', 'VR', 'ANON', 'ALU', 'GORK', 'DEGEN', 
      'DEAI', 'ALPINE', 'BLZ', 'CHESS', 'DODO', 'DEVVE', 'CPOOL', 
      'ARKM', 'AUCTION', 'AR', 'VVAIFU'
    ];
    
    console.log(`📝 Inserindo dados para ${symbols.length} símbolos...`);
    
    const testData = [];
    const now = new Date();
    
    // Criar dados de teste para as últimas 24 horas
    for (const symbol of symbols) {
      // Gerar spreads aleatórios entre 0.1% e 2.0%
      const maxSpread = Math.random() * 1.9 + 0.1; // 0.1% a 2.0%
      const minSpread = Math.random() * 0.5; // 0% a 0.5%
      
      // Criar múltiplos registros para cada símbolo
      for (let i = 0; i < 10; i++) {
        const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
        const spread = Math.random() * (maxSpread - minSpread) + minSpread;
        const spotPrice = Math.random() * 100 + 0.001;
        const futuresPrice = spotPrice * (1 + spread / 100);
        
        testData.push({
          symbol: symbol,
          spread: spread,
          spotPrice: spotPrice,
          futuresPrice: futuresPrice,
          exchangeBuy: 'gateio',
          exchangeSell: 'mexc',
          direction: 'spot_to_futures',
          timestamp: timestamp
        });
      }
    }
    
    console.log(`📊 Inserindo ${testData.length} registros...`);
    
    // Inserir dados em lotes
    const batchSize = 50;
    for (let i = 0; i < testData.length; i += batchSize) {
      const batch = testData.slice(i, i + batchSize);
      await prisma.spreadHistory.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} inserido`);
    }
    
    console.log('🎉 Dados de teste inseridos com sucesso!');
    
    // Verificar se os dados foram inseridos
    const count = await prisma.spreadHistory.count();
    console.log(`📊 Total de registros no banco: ${count}`);
    
    // Verificar dados para alguns símbolos
    for (const symbol of symbols.slice(0, 3)) {
      const stats = await prisma.spreadHistory.groupBy({
        by: ['symbol'],
        where: { symbol: symbol },
        _max: { spread: true },
        _min: { spread: true },
        _count: { id: true }
      });
      
      if (stats.length > 0) {
        const stat = stats[0];
        console.log(`${symbol}: Max=${stat._max.spread?.toFixed(4)}%, Min=${stat._min.spread?.toFixed(4)}%, Count=${stat._count.id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão fechada');
  }
}

insertTestData(); 