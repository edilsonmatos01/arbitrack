require('dotenv').config();

console.log('🔍 Teste de configurações de pool do Prisma...');
console.log('');

const { PrismaClient } = require('@prisma/client');

// Configurações de pool específicas
const configs = [
  {
    name: 'Pool Configuração 1',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: ['error', 'warn']
    }
  },
  {
    name: 'Pool Configuração 2',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: ['error', 'warn']
    }
  }
];

async function testConfig(config, name) {
  console.log(`=== TESTE: ${name} ===`);
  
  const prisma = new PrismaClient(config);
  
  try {
    console.log('🔌 Tentando conectar...');
    
    // Teste simples primeiro
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexão básica OK!');
    
    // Teste com tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 5
    `;
    console.log('✅ Consulta de tabelas OK!');
    console.log('📊 Tabelas encontradas:', tables.length);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('❌ FALHOU:', error.message);
    if (error.code) console.log('🔍 Código:', error.code);
    await prisma.$disconnect();
    return false;
  }
}

async function runTests() {
  console.log('🔧 Testando configurações de pool...');
  console.log('');
  
  const results = [];
  
  for (const config of configs) {
    results.push(await testConfig(config.config, config.name));
    console.log(''); // Espaço entre testes
  }
  
  console.log('📊 RESUMO:');
  results.forEach((result, index) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${configs[index].name}`);
  });
}

runTests(); 