#!/usr/bin/env node

/**
 * Script de Instalação e Inicialização - Sistema de Arbitragem
 * 
 * Este script resolve problemas de dependências e inicia o sistema
 * 
 * Uso: node install-and-start.js
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');

// Função de logging
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
}

// Função para executar comando
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    log(description);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`Erro: ${error.message}`, 'ERROR');
        reject(error);
      } else {
        log(`${description} - Concluído`);
        resolve();
      }
    });
  });
}

// Função para verificar se arquivo existe
function checkFile(file, description) {
  if (!fs.existsSync(file)) {
    log(`ERRO: ${description} não encontrado: ${file}`, 'ERROR');
    return false;
  }
  log(`${description} encontrado: ${file}`);
  return true;
}

// Função principal
async function main() {
  try {
    log('=== INSTALAÇÃO E INICIALIZAÇÃO DO SISTEMA ===');
    
    // Verificar arquivos essenciais
    const requiredFiles = [
      { file: 'package.json', description: 'package.json' },
      { file: 'prisma/schema.prisma', description: 'Schema do Prisma' },
      { file: 'scripts/background-worker-robust.ts', description: 'Worker script' }
    ];
    
    for (const { file, description } of requiredFiles) {
      if (!checkFile(file, description)) {
        process.exit(1);
      }
    }
    
    // Verificar se .env existe
    if (!fs.existsSync('.env')) {
      log('Arquivo .env não encontrado!', 'ERROR');
      log('Execute primeiro: node setup-initial-config.js', 'ERROR');
      process.exit(1);
    }
    
    // Instalar dependências
    await runCommand('npm install', 'Instalando dependências');
    
    // Gerar cliente Prisma
    await runCommand('npx prisma generate', 'Gerando cliente Prisma');
    
    // Compilar worker
    await runCommand('npm run build:worker', 'Compilando worker');
    
    // Compilar aplicação web
    await runCommand('npm run build', 'Compilando aplicação web');
    
    log('=== SISTEMA PRONTO ===');
    log('Iniciando componentes...');
    
    // Iniciar worker
    const worker = spawn('node', ['dist/worker/background-worker.js'], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    // Aguardar um pouco antes de iniciar o servidor web
    setTimeout(() => {
      // Iniciar servidor web
      const webServer = spawn('npm', ['start'], {
        stdio: 'inherit',
        env: { ...process.env, PORT: process.env.PORT || 10000 }
      });
      
      // Handlers para encerramento
      process.on('SIGINT', () => {
        log('Encerrando sistema...');
        worker.kill('SIGTERM');
        webServer.kill('SIGTERM');
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        log('Encerrando sistema...');
        worker.kill('SIGTERM');
        webServer.kill('SIGTERM');
        process.exit(0);
      });
    }, 2000);
    
  } catch (error) {
    log(`Erro fatal: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Executar
main().catch((error) => {
  log(`Erro na inicialização: ${error.message}`, 'ERROR');
  process.exit(1);
}); 