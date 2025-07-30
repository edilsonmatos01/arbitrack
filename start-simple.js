#!/usr/bin/env node

/**
 * Script de Inicialização Simples - Sistema de Arbitragem
 * 
 * Este script instala dependências e inicia o sistema de forma simples
 * 
 * Uso: node start-simple.js
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');

// Função de logging
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
}

// Função para instalar dependências
async function installDependencies() {
  return new Promise((resolve, reject) => {
    log('Verificando dependências...');
    
    if (!fs.existsSync('node_modules')) {
      log('Instalando dependências...');
      exec('npm install', (error, stdout, stderr) => {
        if (error) {
          log(`Erro ao instalar dependências: ${error.message}`, 'ERROR');
          reject(error);
        } else {
          log('Dependências instaladas com sucesso');
          resolve();
        }
      });
    } else {
      log('Dependências já instaladas');
      resolve();
    }
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

// Função para compilar worker
async function buildWorker() {
  return new Promise((resolve, reject) => {
    log('Compilando worker...');
    exec('npm run build:worker', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao compilar worker: ${error.message}`, 'ERROR');
        reject(error);
      } else {
        log('Worker compilado com sucesso');
        resolve();
      }
    });
  });
}

// Função para compilar aplicação web
async function buildWebApp() {
  return new Promise((resolve, reject) => {
    log('Compilando aplicação web...');
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao compilar aplicação: ${error.message}`, 'ERROR');
        reject(error);
      } else {
        log('Aplicação web compilada com sucesso');
        resolve();
      }
    });
  });
}

// Função para iniciar o sistema
function startSystem() {
  log('Iniciando sistema...');
  
  // Iniciar worker
  const worker = spawn('node', ['dist/worker/background-worker.js'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
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
}

// Função principal
async function main() {
  try {
    log('=== INICIANDO SISTEMA DE ARBITRAGEM ===');
    
    // Verificar se .env existe
    if (!fs.existsSync('.env')) {
      log('Arquivo .env não encontrado!', 'ERROR');
      log('Execute primeiro: node setup-initial-config.js', 'ERROR');
      process.exit(1);
    }
    
    // Instalar dependências
    await installDependencies();
    
    // Gerar cliente Prisma
    await generatePrismaClient();
    
    // Compilar worker
    await buildWorker();
    
    // Compilar aplicação web
    await buildWebApp();
    
    log('=== SISTEMA PRONTO ===');
    log('Iniciando componentes...');
    
    // Iniciar sistema
    startSystem();
    
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