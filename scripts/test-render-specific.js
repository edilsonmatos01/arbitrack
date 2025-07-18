require('dotenv').config();

console.log('🔍 Teste específico para Render...');
console.log('');

const { PrismaClient } = require('@prisma/client');

// Configurações específicas para Render
const renderConfigs = [
  {
    name: 'Render Config 1 - SSL Require + Timeout',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=require&connect_timeout=60&application_name=arbitragem'
        }
      },
      log: ['error', 'warn']
    }
  },
  {
    name: 'Render Config 2 - SSL Prefer + Pool',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=prefer&connect_timeout=60&pool_timeout=60'
        }
      },
      log: ['error', 'warn']
    }
  },
  {
    name: 'Render Config 3 - Sem SSL + Timeout',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=disable&connect_timeout=60'
        }
      },
      log: ['error', 'warn']
    }
  },
  {
    name: 'Render Config 4 - URL Original',
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

async function testRenderConfig(config, name) {
  console.log(`=== TESTE: ${name} ===`);
  console.log('URL:', config.datasources.db.url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  const prisma = new PrismaClient(config);
  
  try {
    console.log('🔌 Tentando conectar...');
    
    // Teste simples
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ SUCESSO!');
    console.log('📊 Resultado:', result[0]);
    
    // Teste de tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
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

async function runRenderTests() {
  console.log('🔧 Testando configurações específicas do Render...');
  console.log('');
  
  const results = [];
  
  for (const config of renderConfigs) {
    results.push(await testRenderConfig(config.config, config.name));
    console.log(''); // Espaço entre testes
  }
  
  console.log('📊 RESUMO:');
  results.forEach((result, index) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${renderConfigs[index].name}`);
  });
}

runRenderTests(); 