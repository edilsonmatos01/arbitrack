const WebSocket = require('ws');
const http = require('http');

console.log('🧪 Testando worker localmente...\n');

// Teste 1: Verificar se o worker inicia
console.log('1️⃣ Testando inicialização do worker...');
try {
  const worker = require('./worker/background-worker-ultra-simple.js');
  console.log('✅ Worker carregado com sucesso');
} catch (error) {
  console.log('❌ Erro ao carregar worker:', error.message);
}

// Teste 2: Verificar se a porta está livre
console.log('\n2️⃣ Verificando se a porta 10000 está livre...');
const testServer = http.createServer();
testServer.listen(10000, () => {
  console.log('✅ Porta 10000 está livre');
  testServer.close();
});

testServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log('❌ Porta 10000 já está em uso');
  } else {
    console.log('❌ Erro ao testar porta:', error.message);
  }
});

// Teste 3: Verificar dependências
console.log('\n3️⃣ Verificando dependências...');
try {
  require('ws');
  console.log('✅ WebSocket (ws) disponível');
} catch (error) {
  console.log('❌ WebSocket não disponível:', error.message);
}

console.log('\n🎯 PRÓXIMO PASSO:');
console.log('Execute: node worker/background-worker-ultra-simple.js');
console.log('Em outro terminal, execute: curl http://localhost:10000/health'); 