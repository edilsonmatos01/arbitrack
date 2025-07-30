#!/usr/bin/env node

/**
 * Script de Inicialização Único - Sistema de Arbitragem
 * 
 * Este script configura e inicia todos os componentes necessários:
 * - Verificação de ambiente e dependências
 * - Configuração do banco de dados
 * - Inicialização do worker de monitoramento
 * - Inicialização do servidor web
 * - Monitoramento de saúde do sistema
 * 
 * Uso: node start-final-working.js
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
  PORT: process.env.PORT || 10000,
  DATABASE_URL: process.env.DATABASE_URL,
  WORKER_INTERVAL: 5000, // 5 segundos
  HEALTH_CHECK_INTERVAL: 30000, // 30 segundos
  MAX_RESTART_ATTEMPTS: 3,
  LOG_FILE: 'startup-logs.txt'
};

// Estado global
let isShuttingDown = false;
let workerProcess = null;
let webServerProcess = null;
let restartAttempts = 0;
let healthCheckInterval = null;
let prisma = null;

// Função de logging
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Salvar no arquivo de log
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
}

// Função para verificar se o arquivo .env existe
function checkEnvironment() {
  log('Verificando configuração do ambiente...');
  
  if (!fs.existsSync('.env')) {
    log('Arquivo .env não encontrado!', 'ERROR');
    log('Criando arquivo .env com configurações padrão...', 'WARN');
    
    const defaultEnv = `# Configurações do Sistema de Arbitragem
DATABASE_URL="postgresql://username:password@localhost:5432/arbitragem_db"
PORT=10000

# API Keys (configure conforme necessário)
GATEIO_API_KEY=""
GATEIO_SECRET_KEY=""
MEXC_API_KEY=""
MEXC_SECRET_KEY=""

# Configurações do Worker
WORKER_INTERVAL=5000
HEALTH_CHECK_INTERVAL=30000

# Configurações de Log
LOG_LEVEL=INFO
`;
    
    fs.writeFileSync('.env', defaultEnv);
    log('Arquivo .env criado com configurações padrão', 'INFO');
  }
  
  // Verificar variáveis críticas
  if (!process.env.DATABASE_URL) {
    log('DATABASE_URL não configurada!', 'ERROR');
    process.exit(1);
  }
  
  log('Ambiente verificado com sucesso');
}

// Função para verificar e instalar dependências
async function checkDependencies() {
  log('Verificando dependências...');
  
  const requiredFiles = [
    'package.json',
    'prisma/schema.prisma',
    'scripts/background-worker-robust.ts',
    'scripts/monitor-cron.ts'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`Arquivo necessário não encontrado: ${file}`, 'ERROR');
      process.exit(1);
    }
  }
  
  // Verificar se node_modules existe
  if (!fs.existsSync('node_modules')) {
    log('Dependências não instaladas, instalando...', 'WARN');
    await installDependencies();
  } else {
    log('Dependências já instaladas');
  }
  
  // Verificar se @prisma/client está disponível
  try {
    require('@prisma/client');
    log('Prisma client disponível');
  } catch (error) {
    log('Prisma client não encontrado, gerando...', 'WARN');
    await generatePrismaClient();
  }
  
  log('Dependências verificadas com sucesso');
}

// Função para instalar dependências
async function installDependencies() {
  return new Promise((resolve, reject) => {
    log('Executando npm install...');
    exec('npm install', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao instalar dependências: ${error.message}`, 'ERROR');
        reject(error);
      } else {
        log('Dependências instaladas com sucesso');
        resolve();
      }
    });
  });
}

// Função para gerar cliente Prisma
async function generatePrismaClient() {
  return new Promise((resolve, reject) => {
    log('Gerando cliente Prisma...');
    exec('npx prisma generate', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao gerar cliente Prisma: ${error.message}`, 'ERROR');
        reject(error);
      } else {
        log('Cliente Prisma gerado com sucesso');
        resolve();
      }
    });
  });
}

// Função para verificar e configurar banco de dados
async function setupDatabase() {
  log('Configurando banco de dados...');
  
  try {
    // Inicializar Prisma client
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    
    // Verificar conexão com o banco
    await prisma.$connect();
    log('Conexão com banco de dados estabelecida');
    
    // Verificar se as tabelas existem
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    log(`Encontradas ${tableCount[0].count} tabelas no banco`);
    
    // Executar migrações se necessário
    log('Executando migrações do banco...');
    exec('npx prisma migrate deploy', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao executar migrações: ${error.message}`, 'ERROR');
      } else {
        log('Migrações executadas com sucesso');
      }
    });
    
  } catch (error) {
    log(`Erro ao configurar banco: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Função para iniciar o worker de monitoramento
function startWorker() {
  log('Iniciando worker de monitoramento...');
  
  if (workerProcess) {
    log('Worker já está em execução, encerrando processo anterior...');
    workerProcess.kill();
  }
  
  // Compilar o worker se necessário
  const workerScript = 'scripts/background-worker-robust.ts';
  const compiledWorker = 'dist/worker/background-worker.js';
  
  if (!fs.existsSync(compiledWorker)) {
    log('Compilando worker...');
    exec('npm run build:worker', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao compilar worker: ${error.message}`, 'ERROR');
        return;
      }
      log('Worker compilado com sucesso');
      startWorkerProcess();
    });
  } else {
    startWorkerProcess();
  }
}

function startWorkerProcess() {
  workerProcess = spawn('node', ['dist/worker/background-worker.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });
  
  workerProcess.stdout.on('data', (data) => {
    log(`[WORKER] ${data.toString().trim()}`);
  });
  
  workerProcess.stderr.on('data', (data) => {
    log(`[WORKER ERROR] ${data.toString().trim()}`, 'ERROR');
  });
  
  workerProcess.on('close', (code) => {
    log(`Worker encerrado com código ${code}`);
    if (!isShuttingDown && restartAttempts < CONFIG.MAX_RESTART_ATTEMPTS) {
      restartAttempts++;
      log(`Reiniciando worker (tentativa ${restartAttempts}/${CONFIG.MAX_RESTART_ATTEMPTS})...`);
      setTimeout(startWorker, 5000);
    }
  });
  
  log('Worker iniciado com sucesso');
}

// Função para iniciar o servidor web
function startWebServer() {
  log('Iniciando servidor web...');
  
  if (webServerProcess) {
    log('Servidor web já está em execução, encerrando processo anterior...');
    webServerProcess.kill();
  }
  
  // Verificar se o build existe
  const buildDir = '.next';
  if (!fs.existsSync(buildDir)) {
    log('Build não encontrado, executando build...');
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao fazer build: ${error.message}`, 'ERROR');
        return;
      }
      log('Build concluído com sucesso');
      startWebServerProcess();
    });
  } else {
    startWebServerProcess();
  }
}

function startWebServerProcess() {
  webServerProcess = spawn('npm', ['start'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PORT: CONFIG.PORT }
  });
  
  webServerProcess.stdout.on('data', (data) => {
    log(`[WEB] ${data.toString().trim()}`);
  });
  
  webServerProcess.stderr.on('data', (data) => {
    log(`[WEB ERROR] ${data.toString().trim()}`, 'ERROR');
  });
  
  webServerProcess.on('close', (code) => {
    log(`Servidor web encerrado com código ${code}`);
    if (!isShuttingDown && restartAttempts < CONFIG.MAX_RESTART_ATTEMPTS) {
      restartAttempts++;
      log(`Reiniciando servidor web (tentativa ${restartAttempts}/${CONFIG.MAX_RESTART_ATTEMPTS})...`);
      setTimeout(startWebServer, 5000);
    }
  });
  
  log(`Servidor web iniciado na porta ${CONFIG.PORT}`);
}

// Função para verificar saúde do sistema
function startHealthCheck() {
  log('Iniciando monitoramento de saúde do sistema...');
  
  healthCheckInterval = setInterval(async () => {
    try {
      // Verificar conexão com banco
      if (prisma) {
        await prisma.$queryRaw`SELECT 1`;
      }
      
      // Verificar se os processos estão rodando
      if (workerProcess && workerProcess.killed) {
        log('Worker parou, reiniciando...', 'WARN');
        startWorker();
      }
      
      if (webServerProcess && webServerProcess.killed) {
        log('Servidor web parou, reiniciando...', 'WARN');
        startWebServer();
      }
      
      log('Sistema saudável');
      
    } catch (error) {
      log(`Erro no health check: ${error.message}`, 'ERROR');
    }
  }, CONFIG.HEALTH_CHECK_INTERVAL);
}

// Função para encerramento graceful
async function gracefulShutdown() {
  log('Iniciando encerramento graceful...');
  isShuttingDown = true;
  
  // Parar health check
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  // Encerrar processos
  if (workerProcess) {
    workerProcess.kill('SIGTERM');
  }
  
  if (webServerProcess) {
    webServerProcess.kill('SIGTERM');
  }
  
  // Aguardar encerramento dos processos
  setTimeout(async () => {
    try {
      if (prisma) {
        await prisma.$disconnect();
      }
      log('Sistema encerrado com sucesso');
      process.exit(0);
    } catch (error) {
      log(`Erro ao encerrar: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  }, 5000);
}

// Função principal
async function main() {
  try {
    log('=== INICIANDO SISTEMA DE ARBITRAGEM ===');
    
    // Verificações iniciais
    checkEnvironment();
    await checkDependencies();
    await setupDatabase();
    
    // Iniciar componentes
    startWorker();
    startWebServer();
    startHealthCheck();
    
    log('=== SISTEMA INICIADO COM SUCESSO ===');
    log(`Servidor web disponível em: http://localhost:${CONFIG.PORT}`);
    log('Pressione Ctrl+C para encerrar o sistema');
    
  } catch (error) {
    log(`Erro fatal na inicialização: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Handlers para sinais de encerramento
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handler para erros não capturados
process.on('uncaughtException', (error) => {
  log(`Erro não capturado: ${error.message}`, 'ERROR');
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Promise rejeitada não tratada: ${reason}`, 'ERROR');
  gracefulShutdown();
});

// Iniciar sistema
main().catch((error) => {
  log(`Erro na inicialização: ${error.message}`, 'ERROR');
  process.exit(1);
}); 