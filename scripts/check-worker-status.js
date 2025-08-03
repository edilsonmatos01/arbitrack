const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWorkerStatus() {
  try {
    console.log('🔍 Verificando status do worker...');
    
    // Verificar se o processo está rodando
    const { exec } = require('child_process');
    
    exec('netstat -ano | findstr :10000', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Erro ao verificar porta 10000:', error.message);
        return;
      }
      
      if (stdout) {
        console.log('✅ Worker rodando na porta 10000');
        console.log('📊 Conexões ativas:');
        console.log(stdout);
      } else {
        console.log('❌ Worker não está rodando na porta 10000');
      }
    });
    
    // Verificar registros muito recentes (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentRecords = await prisma.spreadHistory.findMany({
      where: {
        timestamp: {
          gte: fiveMinutesAgo
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    console.log('\n📊 Registros dos últimos 5 minutos:', recentRecords.length);
    if (recentRecords.length > 0) {
      recentRecords.forEach(record => {
        console.log(`  - ${record.symbol}: ${record.spread.toFixed(4)}% (${record.timestamp.toLocaleString()})`);
      });
    } else {
      console.log('⚠️  Nenhum registro recente - Worker pode não estar salvando');
    }
    
    // Verificar se há erros de conexão com o banco
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Conexão com banco de dados OK');
    } catch (dbError) {
      console.log('❌ Erro na conexão com banco:', dbError.message);
    }
    
    // Verificar se há registros com preços válidos
    const validPriceRecords = await prisma.spreadHistory.findMany({
      where: {
        AND: [
          { spotPrice: { gt: 0 } },
          { futuresPrice: { gt: 0 } }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 3
    });
    
    console.log('\n📊 Últimos registros com preços válidos:', validPriceRecords.length);
    validPriceRecords.forEach(record => {
      console.log(`  - ${record.symbol}: Spot=${record.spotPrice}, Futures=${record.futuresPrice}, Spread=${record.spread.toFixed(4)}%`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkerStatus(); 