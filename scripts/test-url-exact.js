import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

console.log('🔍 Testando URL exata fornecida...');
console.log('');

// URL que você forneceu
const providedUrl = "postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8";

// URL do .env
const envUrl = process.env.DATABASE_URL;

console.log('📊 URL fornecida:', providedUrl);
console.log('📊 URL do .env:', envUrl);
console.log('');

// Verificar se são iguais
if (providedUrl === envUrl) {
  console.log('✅ URLs são idênticas');
} else {
  console.log('❌ URLs são diferentes!');
  console.log('');
  
  // Mostrar diferenças
  console.log('🔍 Comparando caracteres...');
  for (let i = 0; i < Math.max(providedUrl.length, envUrl.length); i++) {
    if (providedUrl[i] !== envUrl[i]) {
      console.log(`Diferença na posição ${i}:`);
      console.log(`  Fornecida: "${providedUrl[i]}" (${providedUrl.charCodeAt(i)})`);
      console.log(`  .env:      "${envUrl[i]}" (${envUrl.charCodeAt(i)})`);
      break;
    }
  }
}

console.log('');
console.log('🔧 Testando com URL fornecida...');



async function testWithUrl(url) {
  let prisma;
  try {
    console.log('🔧 Criando Prisma Client...');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
    });
    
    console.log('✅ Prisma Client criado');
    console.log('');
    
    console.log('🔌 Tentando conectar...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    console.log('📋 Testando consulta simples...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Consulta executada:', result);
    
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

// Testar com URL fornecida
console.log('=== TESTE COM URL FORNECIDA ===');
await testWithUrl(providedUrl);

console.log('');
console.log('=== TESTE COM URL DO .ENV ===');
await testWithUrl(envUrl); 