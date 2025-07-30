#!/usr/bin/env node

/**
 * Script de Configuração Inicial - Sistema de Arbitragem
 * 
 * Este script ajuda a configurar o sistema pela primeira vez:
 * - Cria arquivo .env com configurações padrão
 * - Verifica dependências
 * - Configura banco de dados
 * - Testa conectividade
 * 
 * Uso: node setup-initial-config.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

// Interface para leitura de input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para fazer perguntas ao usuário
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Função de logging
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
}

async function setupInitialConfig() {
  try {
    log('=== CONFIGURAÇÃO INICIAL DO SISTEMA DE ARBITRAGEM ===');
    
    // Verificar se .env já existe
    if (fs.existsSync('.env')) {
      log('Arquivo .env já existe. Deseja sobrescrever? (y/N)');
      const overwrite = await question('Deseja sobrescrever o arquivo .env? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        log('Configuração cancelada pelo usuário');
        rl.close();
        return;
      }
    }
    
    log('Configurando arquivo .env...');
    
    // Coletar informações do usuário
    const databaseUrl = await question('URL do banco de dados (ex: postgresql://user:pass@localhost:5432/arbitragem): ');
    const port = await question('Porta do servidor web (padrão: 10000): ') || '10000';
    
    const gateioApiKey = await question('Gate.io API Key (opcional): ');
    const gateioSecretKey = await question('Gate.io Secret Key (opcional): ');
    const mexcApiKey = await question('MEXC API Key (opcional): ');
    const mexcSecretKey = await question('MEXC Secret Key (opcional): ');
    
    // Criar conteúdo do .env
    const envContent = `# Configurações do Sistema de Arbitragem
# Gerado automaticamente em ${new Date().toISOString()}

# Configurações do Banco de Dados
DATABASE_URL="${databaseUrl}"

# Configurações do Servidor
PORT=${port}

# API Keys (configure conforme necessário)
GATEIO_API_KEY="${gateioApiKey}"
GATEIO_SECRET_KEY="${gateioSecretKey}"
MEXC_API_KEY="${mexcApiKey}"
MEXC_SECRET_KEY="${mexcSecretKey}"

# Configurações do Worker
WORKER_INTERVAL=5000
HEALTH_CHECK_INTERVAL=30000

# Configurações de Log
LOG_LEVEL=INFO

# Configurações de Ambiente
NODE_ENV=production
`;

    // Salvar arquivo .env
    fs.writeFileSync('.env', envContent);
    log('Arquivo .env criado com sucesso');
    
    // Verificar dependências
    log('Verificando dependências...');
    const requiredFiles = [
      'package.json',
      'prisma/schema.prisma',
      'scripts/background-worker-robust.ts',
      'scripts/monitor-cron.ts'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        log(`ERRO: Arquivo necessário não encontrado: ${file}`, 'ERROR');
        rl.close();
        return;
      }
    }
    log('Dependências verificadas com sucesso');
    
    // Instalar dependências se necessário
    log('Verificando se as dependências estão instaladas...');
    if (!fs.existsSync('node_modules')) {
      log('Instalando dependências...');
      exec('npm install', (error, stdout, stderr) => {
        if (error) {
          log(`Erro ao instalar dependências: ${error.message}`, 'ERROR');
        } else {
          log('Dependências instaladas com sucesso');
        }
      });
    } else {
      log('Dependências já estão instaladas');
    }
    
    // Gerar cliente Prisma
    log('Gerando cliente Prisma...');
    exec('npx prisma generate', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao gerar cliente Prisma: ${error.message}`, 'ERROR');
      } else {
        log('Cliente Prisma gerado com sucesso');
      }
    });
    
    // Testar conexão com banco
    log('Testando conexão com banco de dados...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      log('Conexão com banco de dados estabelecida com sucesso');
      
      // Executar migrações
      log('Executando migrações do banco...');
      exec('npx prisma migrate deploy', (error, stdout, stderr) => {
        if (error) {
          log(`Erro ao executar migrações: ${error.message}`, 'ERROR');
        } else {
          log('Migrações executadas com sucesso');
        }
      });
      
    } catch (error) {
      log(`Erro ao conectar com banco: ${error.message}`, 'ERROR');
      log('Verifique se o banco de dados está rodando e acessível');
    } finally {
      await prisma.$disconnect();
    }
    
    // Compilar worker
    log('Compilando worker...');
    exec('npm run build:worker', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao compilar worker: ${error.message}`, 'ERROR');
      } else {
        log('Worker compilado com sucesso');
      }
    });
    
    // Compilar aplicação web
    log('Compilando aplicação web...');
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        log(`Erro ao compilar aplicação: ${error.message}`, 'ERROR');
      } else {
        log('Aplicação compilada com sucesso');
      }
    });
    
    log('=== CONFIGURAÇÃO CONCLUÍDA ===');
    log('Para iniciar o sistema, execute: node start-final-working.js');
    log('Ou use: npm run start:final');
    log('O sistema estará disponível em: http://localhost:' + port);
    
  } catch (error) {
    log(`Erro na configuração: ${error.message}`, 'ERROR');
  } finally {
    rl.close();
  }
}

// Executar configuração
setupInitialConfig().catch((error) => {
  log(`Erro fatal: ${error.message}`, 'ERROR');
  process.exit(1);
}); 