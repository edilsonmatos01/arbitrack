require('dotenv').config();

console.log('🔍 Testando configuração de pool do Prisma...');
console.log('');

const { PrismaClient } = require('@prisma/client');

// Configuração com pool específico
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?sslmode=require&connect_timeout=60&application_name=arbitragem',
    },
  },
  log: ['error', 'warn'],
  // Configurações de pool específicas
  __internal: {
    engine: {
      binaryTargets: ['native', 'rhel-openssl-3.0.x']
    }
  }
});

async function testPoolConfig() {
  console.log('=== TESTE: Configuração de Pool ===');
  
  try {
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
    
    console.log('🎉 TESTE PASSOU!');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('🔍 Código:', error.code);
    await prisma.$disconnect();
    return false;
  }
}

testPoolConfig(); 