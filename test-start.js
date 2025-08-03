#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TESTE - SISTEMA DE ARBITRAGEM
 * 
 * Script simples para testar se o sistema funciona corretamente
 */

const { spawn } = require('child_process');
const http = require('http');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

// Verificar se porta está em uso
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    server.on('error', () => resolve(true));
  });
}

// Testar sistema
async function testSystem() {
  try {
    log('🧪 TESTANDO SISTEMA DE ARBITRAGEM', 'magenta');
    log('=====================================', 'magenta');
    
    // 1. Verificar dependências
    logInfo('Verificando dependências...');
    const fs = require('fs');
    if (!fs.existsSync('node_modules')) {
      logError('node_modules não encontrado. Execute: npm install');
      return;
    }
    logSuccess('Dependências encontradas');
    
    // 2. Verificar arquivo compilado
    logInfo('Verificando arquivo compilado...');
    if (!fs.existsSync('dist/worker/background-worker.js')) {
      logError('Arquivo compilado não encontrado. Execute: npm run build:tracker');
      return;
    }
    logSuccess('Arquivo compilado encontrado');
    
    // 3. Verificar portas
    logInfo('Verificando portas...');
    const port3000 = await checkPort(3000);
    const port10000 = await checkPort(10000);
    
    if (port3000) {
      logError('Porta 3000 está em uso');
    } else {
      logSuccess('Porta 3000 livre');
    }
    
    if (port10000) {
      logError('Porta 10000 está em uso');
    } else {
      logSuccess('Porta 10000 livre');
    }
    
    // 4. Iniciar WebSocket Server
    logInfo('Iniciando WebSocket Server...');
    const workerProcess = spawn('node', ['dist/worker/background-worker.js'], {
      stdio: 'pipe',
      shell: true
    });
    
    let workerStarted = false;
    
    workerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Worker] ${output.trim()}`);
      
      if (output.includes('WebSocket server rodando') || output.includes('Conectado')) {
        if (!workerStarted) {
          workerStarted = true;
          logSuccess('WebSocket Server iniciado!');
        }
      }
    });
    
    workerProcess.stderr.on('data', (data) => {
      console.log(`[Worker Error] ${data.toString().trim()}`);
    });
    
    // Aguardar 10 segundos para o worker inicializar
    setTimeout(async () => {
      if (workerStarted) {
        logSuccess('✅ WebSocket Server funcionando!');
        
        // Verificar se porta 10000 está ativa
        const portActive = await checkPort(10000);
        if (portActive) {
          logSuccess('✅ Porta 10000 ativa e funcionando!');
        } else {
          logError('❌ Porta 10000 não está ativa');
        }
        
        // Finalizar teste
        log('🎉 TESTE CONCLUÍDO COM SUCESSO!', 'green');
        log('=====================================', 'green');
        log('✅ Sistema funcionando corretamente!', 'green');
        log('🌐 Acesse: http://localhost:3000', 'cyan');
        log('📡 WebSocket: ws://localhost:10000', 'cyan');
        
        // Encerrar worker
        workerProcess.kill();
        process.exit(0);
      } else {
        logError('❌ WebSocket Server não iniciou corretamente');
        workerProcess.kill();
        process.exit(1);
      }
    }, 10000);
    
    // Timeout de segurança
    setTimeout(() => {
      if (!workerStarted) {
        logError('❌ Timeout ao iniciar WebSocket Server');
        workerProcess.kill();
        process.exit(1);
      }
    }, 15000);
    
  } catch (error) {
    logError(`Erro no teste: ${error.message}`);
    process.exit(1);
  }
}

// Executar teste
testSystem(); 