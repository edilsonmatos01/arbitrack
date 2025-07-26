#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Spread Monitor...');

// Função para iniciar o spread-monitor
function startSpreadMonitor() {
  const scriptPath = path.join(__dirname, 'scripts', 'spread-monitor.ts');
  
  console.log(`📁 Executando: ${scriptPath}`);
  
  const child = spawn('npx', ['ts-node', scriptPath], {
    stdio: 'inherit',
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  child.on('error', (error) => {
    console.error('❌ Erro ao iniciar spread-monitor:', error);
  });

  child.on('exit', (code) => {
    console.log(`📊 Spread Monitor encerrado com código: ${code}`);
    if (code !== 0) {
      console.log('🔄 Reiniciando em 5 segundos...');
      setTimeout(startSpreadMonitor, 5000);
    }
  });

  // Tratamento de sinais para encerramento gracioso
  process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, encerrando spread-monitor...');
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, encerrando spread-monitor...');
    child.kill('SIGTERM');
  });
}

// Inicia o monitoramento
startSpreadMonitor(); 