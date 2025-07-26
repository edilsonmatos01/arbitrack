#!/usr/bin/env node

// SCRIPT DE INICIALIZAÇÃO DO SISTEMA DE ARBITRAGEM
// Este script inicia o sistema completo de arbitragem

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 INICIANDO SISTEMA DE ARBITRAGEM...');
console.log('=' * 50);

// Função para executar comando
function runCommand(command, args, name) {
    return new Promise((resolve, reject) => {
        console.log(`\n📡 Iniciando ${name}...`);
        
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true
        });
        
        child.on('error', (error) => {
            console.error(`❌ Erro ao iniciar ${name}:`, error);
            reject(error);
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${name} finalizado com sucesso`);
                resolve();
            } else {
                console.error(`❌ ${name} finalizado com código ${code}`);
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
}

// Função principal
async function startSystem() {
    try {
        // 1. Teste de conectividade
        console.log('\n🔍 Testando conectividade das WebSockets...');
        await runCommand('node', ['test-websocket-connections.js'], 'Teste de Conectividade');
        
        // 2. Iniciar worker de arbitragem
        console.log('\n🚀 Iniciando worker de arbitragem...');
        await runCommand('node', ['worker/background-worker-fixed.js'], 'Worker de Arbitragem');
        
    } catch (error) {
        console.error('\n❌ Erro no sistema:', error.message);
        process.exit(1);
    }
}

// Handlers de shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Recebido sinal de parada...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido sinal de término...');
    process.exit(0);
});

// Iniciar sistema
startSystem().catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
}); 