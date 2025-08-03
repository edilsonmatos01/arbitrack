require('dotenv').config();

console.log('🔍 Testando URL exata do banco de dados...');
console.log('');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('❌ DATABASE_URL não definida');
  process.exit(1);
}

console.log('📊 URL completa:', dbUrl);
console.log('');

// Extrair componentes da URL
const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
if (urlParts) {
  const [, user, password, host, database] = urlParts;
  console.log('🔧 Componentes da URL:');
  console.log('  - Usuário:', user);
  console.log('  - Senha:', password.substring(0, 8) + '...');
  console.log('  - Host:', host);
  console.log('  - Banco:', database);
  console.log('');
  
  // Verificar se o host está correto
  if (host.includes('dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com')) {
    console.log('✅ Host parece correto');
  } else {
    console.log('❌ Host pode estar incorreto');
  }
  
  // Verificar se o banco está correto
  if (database === 'arbitragem_banco_bdx8') {
    console.log('✅ Nome do banco correto');
  } else {
    console.log('❌ Nome do banco pode estar incorreto:', database);
  }
} else {
  console.log('❌ Não foi possível extrair componentes da URL');
}

console.log('');
console.log('🌐 Testando conectividade básica...');

// Teste básico de conectividade usando net
const net = require('net');

const host = 'dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com';
const port = 5432;

const socket = new net.Socket();

socket.setTimeout(10000); // 10 segundos de timeout

socket.on('connect', () => {
  console.log('✅ Conexão TCP estabelecida com sucesso!');
  socket.destroy();
});

socket.on('timeout', () => {
  console.log('❌ Timeout na conexão TCP');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log('❌ Erro na conexão TCP:', err.message);
});

socket.on('close', () => {
  console.log('🔌 Conexão TCP fechada');
});

console.log(`🔌 Tentando conectar em ${host}:${port}...`);
socket.connect(port, host); 