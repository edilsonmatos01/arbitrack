const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
console.log('🔍 Testando variáveis de ambiente...');
console.log('Diretório atual:', __dirname);
console.log('Caminho do .env:', envPath);

// Verificar se o arquivo existe
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env existe');
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('📋 Conteúdo do .env:');
  console.log(content);
} else {
  console.log('❌ Arquivo .env não existe');
}

require('dotenv').config({ path: envPath });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definida' : '❌ Não definida');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (process.env.DATABASE_URL) {
  console.log('📋 URL do banco (primeiros 50 chars):', process.env.DATABASE_URL.substring(0, 50) + '...');
} 