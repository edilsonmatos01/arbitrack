require('dotenv').config();

console.log('🔍 Teste detalhado do Prisma...');
console.log('');

const { PrismaClient } = require('@prisma/client');

// Configurações específicas para Render
const configs = [
  {
    name: 'Configuração Render 1',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=require&connect_timeout=30'
        }
      },
      log: ['query', 'error', 'warn']
    }
  },
  {
    name: 'Configuração Render 2',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=prefer&connect_timeout=30'
        }
      },
      log: ['error', 'warn']
    }
  },
  {
    name: 'Configuração Render 3',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=no-verify&connect_timeout=30'
        }
      }
    }
  },
  {
    name: 'Configuração Render 4',
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
  console.log('URL:', config.datasources?.db?.url?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'URL padrão');
  
  const prisma = new PrismaClient(config);
  
  try {
    console.log('🔌 Tentando conectar...');
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time, version() as pg_version`;
    console.log('✅ SUCESSO!');
    console.log('📊 Resultado:', result[0]);
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
  console.log('🔧 Testando configurações específicas para Render...');
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