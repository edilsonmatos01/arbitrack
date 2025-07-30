#!/usr/bin/env node

/**
 * Script de Diagnóstico - Sistema de Arbitragem
 * 
 * Este script diagnostica problemas no sistema
 * 
 * Uso: node diagnose-system.js
 */

const { exec } = require('child_process');
const fs = require('fs');

// Função de logging
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
}

// Função para verificar se arquivo existe
function checkFile(file, description) {
  if (fs.existsSync(file)) {
    log(`✓ ${description}: ${file}`, 'SUCCESS');
    return true;
  } else {
    log(`✗ ${description}: ${file} - NÃO ENCONTRADO`, 'ERROR');
    return false;
  }
}

// Função para verificar se comando funciona
function checkCommand(command, description) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`✗ ${description}: ${error.message}`, 'ERROR');
        resolve(false);
      } else {
        log(`✓ ${description}: Funcionando`, 'SUCCESS');
        resolve(true);
      }
    });
  });
}

// Função principal
async function main() {
  log('=== DIAGNÓSTICO DO SISTEMA DE ARBITRAGEM ===');
  
  let allGood = true;
  
  // Verificar arquivos essenciais
  log('\n--- Verificando Arquivos Essenciais ---');
  const files = [
    { file: 'package.json', description: 'package.json' },
    { file: 'prisma/schema.prisma', description: 'Schema do Prisma' },
    { file: 'scripts/background-worker-robust.ts', description: 'Worker script' },
    { file: 'scripts/monitor-cron.ts', description: 'Monitor script' },
    { file: '.env', description: 'Arquivo de configuração' }
  ];
  
  for (const { file, description } of files) {
    if (!checkFile(file, description)) {
      allGood = false;
    }
  }
  
  // Verificar Node.js
  log('\n--- Verificando Node.js ---');
  const nodeVersion = await checkCommand('node --version', 'Node.js');
  if (!nodeVersion) allGood = false;
  
  // Verificar npm
  log('\n--- Verificando npm ---');
  const npmVersion = await checkCommand('npm --version', 'npm');
  if (!npmVersion) allGood = false;
  
  // Verificar dependências
  log('\n--- Verificando Dependências ---');
  if (fs.existsSync('node_modules')) {
    log('✓ node_modules encontrado', 'SUCCESS');
    
    // Verificar @prisma/client
    try {
      require('@prisma/client');
      log('✓ @prisma/client disponível', 'SUCCESS');
    } catch (error) {
      log('✗ @prisma/client não encontrado', 'ERROR');
      allGood = false;
    }
  } else {
    log('✗ node_modules não encontrado', 'ERROR');
    allGood = false;
  }
  
  // Verificar Prisma
  log('\n--- Verificando Prisma ---');
  const prismaGenerate = await checkCommand('npx prisma generate', 'Prisma generate');
  if (!prismaGenerate) allGood = false;
  
  // Verificar compilação
  log('\n--- Verificando Compilação ---');
  const buildWorker = await checkCommand('npm run build:worker', 'Build worker');
  if (!buildWorker) allGood = false;
  
  const buildWeb = await checkCommand('npm run build', 'Build web app');
  if (!buildWeb) allGood = false;
  
  // Verificar arquivos compilados
  log('\n--- Verificando Arquivos Compilados ---');
  const compiledFiles = [
    { file: 'dist/worker/background-worker.js', description: 'Worker compilado' },
    { file: '.next', description: 'Next.js build' }
  ];
  
  for (const { file, description } of compiledFiles) {
    if (!checkFile(file, description)) {
      allGood = false;
    }
  }
  
  // Resultado final
  log('\n=== RESULTADO DO DIAGNÓSTICO ===');
  if (allGood) {
    log('✓ SISTEMA PRONTO PARA USO', 'SUCCESS');
    log('Execute: node install-and-start.js', 'INFO');
  } else {
    log('✗ PROBLEMAS ENCONTRADOS', 'ERROR');
    log('Execute os seguintes comandos:', 'INFO');
    log('1. npm install', 'INFO');
    log('2. npx prisma generate', 'INFO');
    log('3. npm run build:worker', 'INFO');
    log('4. npm run build', 'INFO');
    log('5. node install-and-start.js', 'INFO');
  }
}

// Executar
main().catch((error) => {
  log(`Erro no diagnóstico: ${error.message}`, 'ERROR');
  process.exit(1);
}); 