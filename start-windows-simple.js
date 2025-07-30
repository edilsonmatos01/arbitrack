#!/usr/bin/env node

/**
 * Script de Inicialização para Windows - Versão Simples
 * 
 * Este script inicia o sistema de arbitragem no Windows
 * 
 * Uso: node start-windows-simple.js
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

// Função principal
async function main() {
  try {
    log('=== INICIANDO SISTEMA DE ARBITRAGEM - WINDOWS ===');
    
    // Verificar se .env existe
    if (!fs.existsSync('.env')) {
      log('Arquivo .env não encontrado!', 'ERROR');
      log('Execute primeiro: node setup-initial-config.js', 'ERROR');
      process.exit(1);
    }
    
    // Verificar se node_modules existe
    if (!fs.existsSync('node_modules')) {
      log('Instalando dependências...');
      await runCommand('npm install', 'Instalando dependências');
    }
    
    // Gerar cliente Prisma
    await runCommand('npx prisma generate', 'Gerando cliente Prisma');
    
    // Compilar worker
    await runCommand('npm run build:worker', 'Compilando worker');
    
    // Compilar aplicação web
    await runCommand('npm run build', 'Compilando aplicação web');
    
    log('=== SISTEMA PRONTO ===');
    log('Iniciando componentes...');
    
    // Iniciar worker em background
    const worker = spawn('node', ['dist/worker/background-worker.js'], {
      stdio: 'inherit',
      env: { ...process.env },
      shell: true
    });
    
    log('Worker iniciado em background');
    
    // Aguardar um pouco antes de iniciar o servidor web
    setTimeout(() => {
      log('Iniciando servidor web...');
      
      // Iniciar servidor web usando npx
      const webServer = spawn('npx', ['next', 'start', '-H', '0.0.0.0', '-p', '10000'], {
        stdio: 'inherit',
        env: { ...process.env },
        shell: true
      });
      
      log('Servidor web iniciado');
      
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
      
    }, 3000);
    
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