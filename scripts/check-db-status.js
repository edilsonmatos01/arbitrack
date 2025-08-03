require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkDatabaseStatus() {
  console.log('🔍 Verificando status do banco de dados...');
  
  let prisma;
  try {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    console.log('✅ Prisma Client criado com sucesso');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco de dados estabelecida');
    
    // Verificar configurações de API
    console.log('\n📋 Verificando configurações de API...');
    const configs = await prisma.apiConfiguration.findMany({
      select: {
        id: true,
        exchange: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`📊 Total de configurações encontradas: ${configs.length}`);
    
    if (configs.length > 0) {
      console.log('\n🔑 Configurações ativas:');
      configs.forEach(config => {
        console.log(`  - ${config.exchange.toUpperCase()}: ${config.isActive ? '✅ Ativa' : '❌ Inativa'} (ID: ${config.id})`);
      });
    } else {
      console.log('⚠️  Nenhuma configuração encontrada no banco de dados');
    }
    
    // Verificar variáveis de ambiente
    console.log('\n🌍 Verificando variáveis de ambiente...');
    console.log(`  - DATABASE_URL: ✅ ${process.env.DATABASE_URL ? 'Definida' : '❌ Não definida'}`);
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    
    console.log('\n📡 URLs de WebSocket (dados públicos):');
    console.log('  - Gate.io: wss://api.gateio.ws/ws/v4/');
    console.log('  - MEXC: wss://wbs.mexc.com/ws');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error.message);
    
    // Verificar variáveis de ambiente como fallback
    console.log('\n🌍 Verificando variáveis de ambiente (fallback)...');
    console.log(`  - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Definida' : '❌ Não definida'}`);
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.DATABASE_URL) {
      console.log('\n⚠️  DATABASE_URL configurada, mas banco inacessível');
    } else {
      console.log('\n❌ DATABASE_URL não configurada');
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('\n🔌 Conexão com banco de dados fechada');
    }
  }
}

checkDatabaseStatus().catch(console.error); 