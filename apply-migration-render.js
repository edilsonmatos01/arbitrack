const { PrismaClient } = require('@prisma/client');

console.log('🔧 Aplicando migração no Render...');

async function applyMigration() {
  let prisma = null;
  
  try {
    console.log('🔄 Conectando ao banco...');
    
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    await prisma.$connect();
    console.log('✅ Conectado ao banco');
    
    console.log('🔄 Criando tabela ArbitrageOpportunity...');
    
    // Criar tabela ArbitrageOpportunity
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ArbitrageOpportunity" (
        "id" TEXT NOT NULL,
        "baseSymbol" TEXT NOT NULL,
        "buyExchange" TEXT NOT NULL,
        "buyType" TEXT NOT NULL,
        "buyPrice" DOUBLE PRECISION NOT NULL,
        "sellExchange" TEXT NOT NULL,
        "sellType" TEXT NOT NULL,
        "sellPrice" DOUBLE PRECISION NOT NULL,
        "profitPercentage" DOUBLE PRECISION NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ArbitrageOpportunity_pkey" PRIMARY KEY ("id")
      )
    `;
    
    console.log('✅ Tabela ArbitrageOpportunity criada');
    
    console.log('🔄 Criando índice...');
    
    // Criar índice
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ArbitrageOpportunity_baseSymbol_timestamp_idx" 
      ON "ArbitrageOpportunity"("baseSymbol", "timestamp")
    `;
    
    console.log('✅ Índice criado');
    
    console.log('🔄 Verificando tabela...');
    
    const count = await prisma.arbitrageOpportunity.count();
    console.log(`✅ Tabela verificada. Total de registros: ${count}`);
    
    console.log('🎉 Migração aplicada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    console.error('📋 Detalhes:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Tabela já existe, isso é normal');
    }
    
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log('🔌 Prisma desconectado');
      } catch (e) {
        console.warn('⚠️ Erro ao desconectar Prisma:', e.message);
      }
    }
  }
}

// Executar migração
applyMigration().then(() => {
  console.log('🏁 Migração concluída');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 