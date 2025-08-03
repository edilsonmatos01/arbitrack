require('dotenv').config();

console.log('🔍 Testando diferentes configurações SSL do Prisma...');
console.log('');

const { PrismaClient } = require('@prisma/client');

// Configurações para testar
const configs = [
  {
    name: 'Configuração Original',
    config: {}
  },
  {
    name: 'Com SSL Require',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=require'
        }
      }
    }
  },
  {
    name: 'Com SSL Prefer',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=prefer'
        }
      }
    }
  },
  {
    name: 'Com SSL Disable',
    config: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=disable'
        }
      }
    }
  },
  {
    name: 'Com Configuração Completa',
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
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ SUCESSO!');
    console.log('📊 Resultado:', result[0]);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('❌ FALHOU:', error.message);
    await prisma.$disconnect();
    return false;
  }
}

async function runTests() {
  const results = [];
  
  for (const config of configs) {
    results.push(await testConfig(config.config, config.name));
  }
  
  console.log('');
  console.log('📊 RESUMO:');
  results.forEach((result, index) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${configs[index].name}`);
  });
}

runTests(); 