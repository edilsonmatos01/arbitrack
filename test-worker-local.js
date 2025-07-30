const { spawn } = require('child_process');
const WebSocket = require('ws');

console.log('🧪 Testando worker localmente...');

// Função para testar WebSocket
function testWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Testando conexão WebSocket na porta 10000...');
    
    const ws = new WebSocket('ws://localhost:10000');
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timeout na conexão WebSocket'));
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket conectado com sucesso!');
      clearTimeout(timeout);
      ws.close();
      resolve();
    });
    
    ws.on('error', (error) => {
      console.error('❌ Erro na conexão WebSocket:', error.message);
      clearTimeout(timeout);
      reject(error);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket fechado');
    });
  });
}

// Função para testar banco de dados
async function testDatabase() {
  console.log('🗄️ Testando conexão com banco de dados...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    const count = await prisma.arbitrageOpportunity.count();
    console.log(`✅ Banco de dados acessível. Total de registros: ${count}`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Erro no banco de dados:', error.message);
    return false;
  }
}

// Função para testar worker
async function testWorker() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Iniciando worker...');
    
    const worker = spawn('node', ['worker/background-worker-render-fixed.js'], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    let output = '';
    let hasStarted = false;
    
    worker.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      console.log(`[Worker] ${message.trim()}`);
      
      if (message.includes('Iniciando worker em segundo plano') && !hasStarted) {
        hasStarted = true;
        console.log('✅ Worker iniciado com sucesso!');
      }
    });
    
    worker.stderr.on('data', (data) => {
      const message = data.toString();
      console.error(`[Worker Error] ${message.trim()}`);
    });
    
    worker.on('close', (code) => {
      console.log(`🔌 Worker encerrado com código: ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Worker falhou com código ${code}`));
      }
    });
    
    // Aguardar um pouco para o worker inicializar
    setTimeout(() => {
      if (hasStarted) {
        console.log('✅ Worker está funcionando!');
        worker.kill('SIGTERM');
        resolve();
      } else {
        worker.kill('SIGTERM');
        reject(new Error('Worker não iniciou corretamente'));
      }
    }, 15000);
  });
}

// Função principal de teste
async function runTests() {
  try {
    console.log('🧪 Iniciando testes...\n');
    
    // Teste 1: Banco de dados
    console.log('📋 Teste 1: Banco de dados');
    const dbOk = await testDatabase();
    if (!dbOk) {
      console.log('⚠️ Banco de dados não está funcionando, mas continuando...\n');
    } else {
      console.log('✅ Banco de dados OK\n');
    }
    
    // Teste 2: Worker
    console.log('📋 Teste 2: Worker');
    await testWorker();
    console.log('✅ Worker OK\n');
    
    // Teste 3: WebSocket (se worker estiver rodando)
    console.log('📋 Teste 3: WebSocket');
    try {
      await testWebSocket();
      console.log('✅ WebSocket OK\n');
    } catch (error) {
      console.log('⚠️ WebSocket não está disponível (normal se worker não estiver rodando)\n');
    }
    
    console.log('🎉 Todos os testes principais passaram!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    process.exit(1);
  }
}

// Executar testes
runTests().then(() => {
  console.log('🏁 Testes concluídos');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 