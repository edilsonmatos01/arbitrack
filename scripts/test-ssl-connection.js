import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

console.log('🔍 Testando conexão com configurações SSL...');
console.log('');

// URL original
const originalUrl = process.env.DATABASE_URL;

// URL com parâmetros SSL
const sslUrl = originalUrl + '?sslmode=require';

console.log('📊 URL original (mascarada):', originalUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
console.log('📊 URL com SSL (mascarada):', sslUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
console.log('');

async function testConnection(url, description) {
  console.log(`=== TESTE: ${description} ===`);
  
  let prisma;
  try {
    console.log('🔧 Criando Prisma Client...');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
      log: ['error', 'warn'],
    });
    
    console.log('✅ Prisma Client criado');
    console.log('');
    
    console.log('🔌 Tentando conectar...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    console.log('📋 Testando consulta simples...');
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Consulta executada:', result[0]);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    return false;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Testar URL original
await testConnection(originalUrl, 'URL Original');

console.log('');
console.log('');

// Testar URL com SSL
await testConnection(sslUrl, 'URL com SSL');

console.log('');
console.log('🎯 Teste concluído!'); 