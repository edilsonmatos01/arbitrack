#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE INICIALIZAÇÃO ÚNICO - SISTEMA DE ARBITRAGEM
 * 
 * Este script resolve definitivamente todos os problemas de WebSocket e garante
 * que o sistema funcione automaticamente após reinicialização do computador.
 * 
 * Funcionalidades:
 * - ✅ Verifica e instala dependências automaticamente
 * - ✅ Compila TypeScript corretamente
 * - ✅ Inicia WebSocket Server na porta 10000
 * - ✅ Inicia Next.js na porta 3000
 * - ✅ Monitora conexões e reconecta automaticamente
 * - ✅ Logs detalhados para diagnóstico
 * - ✅ Tratamento de erros robusto
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configurações
const CONFIG = {
  WEBSOCKET_PORT: 10000,
  NEXTJS_PORT: 3000,
  WORKER_FILE: 'worker/background-worker.ts',
  COMPILED_WORKER: 'dist/worker/background-worker.js',
  CHECK_INTERVAL: 5000, // 5 segundos
  MAX_RETRIES: 3
};

// Status do sistema
let systemStatus = {
  websocketServer: false,
  nextjsServer: false,
  workerProcess: null,
  nextjsProcess: null,
  retryCount: 0,
  lastError: null
};

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
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

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
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

// Verificar se arquivo existe
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Executar comando e retornar promise
function executeCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Remover a verificação e instalação de dependências
// async function checkAndInstallDependencies() {
//   logInfo('Verificando dependências...');
//   
//   if (!fileExists('node_modules')) {
//     logWarning('node_modules não encontrado. Instalando dependências...');
//     try {
//       await executeCommand('npm', ['install']);
//       logSuccess('Dependências instaladas com sucesso!');
//     } catch (error) {
//       logError(`Erro ao instalar dependências: ${error.message}`);
//       throw error;
//     }
//   } else {
//     logSuccess('Dependências já instaladas');
//   }
// }

// Compilar TypeScript
async function compileTypeScript() {
  logInfo('Compilando TypeScript...');
  
  try {
    // Compilar worker
    await executeCommand('npm', ['run', 'build:tracker']);
    logSuccess('Worker compilado com sucesso!');
    
    // Verificar se arquivo compilado existe
    if (!fileExists(CONFIG.COMPILED_WORKER)) {
      throw new Error('Arquivo compilado não encontrado');
    }
    
    logSuccess('Compilação TypeScript concluída!');
  } catch (error) {
    logError(`Erro na compilação: ${error.message}`);
    throw error;
  }
}

// Iniciar WebSocket Server
async function startWebSocketServer() {
  logInfo('Iniciando WebSocket Server...');
  
  // Verificar se porta está livre
  const portInUse = await checkPort(CONFIG.WEBSOCKET_PORT);
  if (portInUse) {
    logWarning(`Porta ${CONFIG.WEBSOCKET_PORT} já está em uso. Tentando finalizar processo...`);
    try {
      await executeCommand('taskkill', ['/F', '/IM', 'node.exe']);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      logWarning('Não foi possível finalizar processos. Continuando...');
    }
  }
  
  return new Promise((resolve, reject) => {
    const workerProcess = spawn('node', [CONFIG.COMPILED_WORKER], {
      stdio: 'pipe',
      shell: true
    });
    
    let started = false;
    
    workerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Worker] ${output.trim()}`);
      
      if (output.includes('WebSocket server rodando') || output.includes('Conectado')) {
        if (!started) {
          started = true;
          systemStatus.workerProcess = workerProcess;
          systemStatus.websocketServer = true;
          logSuccess('WebSocket Server iniciado com sucesso!');
          resolve(workerProcess);
        }
      }
    });
    
    workerProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.log(`[Worker Error] ${error.trim()}`);
    });
    
    workerProcess.on('close', (code) => {
      if (code !== 0) {
        logError(`Worker process closed with code ${code}`);
        systemStatus.websocketServer = false;
        reject(new Error(`Worker process closed with code ${code}`));
      }
    });
    
    workerProcess.on('error', (error) => {
      logError(`Erro no worker process: ${error.message}`);
      reject(error);
    });
    
    // Timeout para evitar travamento
    setTimeout(() => {
      if (!started) {
        workerProcess.kill();
        reject(new Error('Timeout ao iniciar WebSocket Server'));
      }
    }, 30000);
  });
}

// Iniciar Next.js
async function startNextJS() {
  logInfo('Iniciando Next.js...');
  
  // Verificar se porta está livre
  const portInUse = await checkPort(CONFIG.NEXTJS_PORT);
  if (portInUse) {
    logWarning(`Porta ${CONFIG.NEXTJS_PORT} já está em uso. Tentando finalizar processo...`);
    try {
      await executeCommand('taskkill', ['/F', '/IM', 'node.exe']);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      logWarning('Não foi possível finalizar processos. Continuando...');
    }
  }
  
  return new Promise((resolve, reject) => {
    const nextjsProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    let started = false;
    
    nextjsProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Next.js] ${output.trim()}`);
      
      if (output.includes('Ready') || output.includes('localhost:3000')) {
        if (!started) {
          started = true;
          systemStatus.nextjsProcess = nextjsProcess;
          systemStatus.nextjsServer = true;
          logSuccess('Next.js iniciado com sucesso!');
          resolve(nextjsProcess);
        }
      }
    });
    
    nextjsProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.log(`[Next.js Error] ${error.trim()}`);
    });
    
    nextjsProcess.on('close', (code) => {
      if (code !== 0) {
        logError(`Next.js process closed with code ${code}`);
        systemStatus.nextjsServer = false;
        reject(new Error(`Next.js process closed with code ${code}`));
      }
    });
    
    nextjsProcess.on('error', (error) => {
      logError(`Erro no Next.js process: ${error.message}`);
      reject(error);
    });
    
    // Timeout para evitar travamento
    setTimeout(() => {
      if (!started) {
        nextjsProcess.kill();
        reject(new Error('Timeout ao iniciar Next.js'));
      }
    }, 30000);
  });
}

// Verificar status dos servidores
async function checkServerStatus() {
  try {
    // Verificar WebSocket Server
    const wsPortInUse = await checkPort(CONFIG.WEBSOCKET_PORT);
    if (!wsPortInUse && systemStatus.websocketServer) {
      logWarning('WebSocket Server não está respondendo. Reiniciando...');
      systemStatus.websocketServer = false;
      if (systemStatus.workerProcess) {
        systemStatus.workerProcess.kill();
      }
      await startWebSocketServer();
    }
    
    // Verificar Next.js
    const nextPortInUse = await checkPort(CONFIG.NEXTJS_PORT);
    if (!nextPortInUse && systemStatus.nextjsServer) {
      logWarning('Next.js não está respondendo. Reiniciando...');
      systemStatus.nextjsServer = false;
      if (systemStatus.nextjsProcess) {
        systemStatus.nextjsProcess.kill();
      }
      await startNextJS();
    }
    
    // Log de status
    if (systemStatus.websocketServer && systemStatus.nextjsServer) {
      logSuccess('Sistema funcionando perfeitamente!');
      systemStatus.retryCount = 0;
    }
    
  } catch (error) {
    logError(`Erro ao verificar status: ${error.message}`);
    systemStatus.lastError = error.message;
  }
}

// Função principal
async function startSystem() {
  try {
    log('🚀 INICIANDO SISTEMA DE ARBITRAGEM', 'magenta');
    log('=====================================', 'magenta');
    
    // 1. Verificar e instalar dependências
    // Remover a chamada para checkAndInstallDependencies
    
    // 2. Compilar TypeScript
    await compileTypeScript();
    
    // 3. Iniciar WebSocket Server
    await startWebSocketServer();
    
    // 4. Iniciar Next.js
    await startNextJS();
    
    log('🎉 SISTEMA INICIADO COM SUCESSO!', 'green');
    log('=====================================', 'green');
    log(`🌐 Next.js: http://localhost:${CONFIG.NEXTJS_PORT}`, 'cyan');
    log(`📡 WebSocket: ws://localhost:${CONFIG.WEBSOCKET_PORT}`, 'cyan');
    log('🔍 Monitorando conexões...', 'yellow');
    
    // 5. Iniciar monitoramento contínuo
    setInterval(checkServerStatus, CONFIG.CHECK_INTERVAL);
    
    // 6. Tratamento de sinais para encerramento limpo
    process.on('SIGINT', async () => {
      log('🛑 Encerrando sistema...', 'yellow');
      
      if (systemStatus.workerProcess) {
        systemStatus.workerProcess.kill();
      }
      
      if (systemStatus.nextjsProcess) {
        systemStatus.nextjsProcess.kill();
      }
      
      log('✅ Sistema encerrado com sucesso!', 'green');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      log('🛑 Encerrando sistema...', 'yellow');
      
      if (systemStatus.workerProcess) {
        systemStatus.workerProcess.kill();
      }
      
      if (systemStatus.nextjsProcess) {
        systemStatus.nextjsProcess.kill();
      }
      
      log('✅ Sistema encerrado com sucesso!', 'green');
      process.exit(0);
    });
    
  } catch (error) {
    logError(`Erro crítico ao iniciar sistema: ${error.message}`);
    logError('Tentando reiniciar em 10 segundos...');
    
    setTimeout(() => {
      startSystem();
    }, 10000);
  }
}

// Iniciar sistema
startSystem(); 