require('dotenv').config();

console.log('🔍 Testando configuração antiga do Prisma...');
console.log('');

const { PrismaClient } = require('@prisma/client');

// Configuração que funcionava antes
const oldConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn'],
  // Configurações específicas para Render
  __internal: {
    engine: {
      binaryTargets: ['native', 'rhel-openssl-3.0.x']
    }
  }
};

async function testOldConfig() {
  console.log('=== TESTE: Configuração Antiga ===');
  console.log('🔧 Criando Prisma Client com configuração antiga...');
  
  const prisma = new PrismaClient(oldConfig);
  
  try {
    console.log('✅ Prisma Client criado');
    console.log('🔌 Tentando conectar...');
    
    // Teste simples
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Resultado:', result[0]);
    
    // Teste de tabelas
    console.log('📋 Verificando tabelas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📊 Tabelas encontradas:', tables.length);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('🔍 Código:', error.code);
    await prisma.$disconnect();
    return false;
  }
}

testOldConfig(); 