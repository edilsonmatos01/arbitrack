#!/usr/bin/env node

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '10000', 10);

console.log(`🚀 Iniciando servidor em modo ${dev ? 'desenvolvimento' : 'produção'}`);
console.log(`📍 Hostname: ${hostname}`);
console.log(`🔌 Porta: ${port}`);
console.log(`📁 Diretório atual: ${process.cwd()}`);

// Verificar se estamos em produção e se o build standalone existe
if (!dev) {
    const standalonePath = path.join(process.cwd(), '.next', 'standalone', 'server.js');
    const standaloneExists = fs.existsSync(standalonePath);
    
    console.log(`📦 Verificando build standalone: ${standalonePath}`);
    console.log(`📦 Standalone existe: ${standaloneExists}`);
    
    if (standaloneExists) {
        try {
            console.log('📦 Carregando servidor standalone...');
            require(standalonePath);
            console.log('✅ Servidor standalone iniciado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao carregar servidor standalone:', error.message);
            console.error('❌ Stack trace:', error.stack);
            process.exit(1);
        }
    } else {
        console.log('⚠️  Build standalone não encontrado, usando servidor Next.js padrão...');
        startNextServer();
    }
} else {
    console.log('🔧 Modo desenvolvimento ativo');
    startNextServer();
}

function startNextServer() {
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    app.prepare().then(() => {
        createServer(async (req, res) => {
            try {
                const parsedUrl = parse(req.url, true);
                await handle(req, res, parsedUrl);
            } catch (err) {
                console.error('❌ Erro no servidor:', err);
                res.statusCode = 500;
                res.end('Internal server error');
            }
        })
        .once('error', (err) => {
            console.error('❌ Erro fatal no servidor:', err);
            process.exit(1);
        })
        .listen(port, hostname, () => {
            console.log(`✅ Servidor Next.js rodando em http://${hostname}:${port}`);
            console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    }).catch((err) => {
        console.error('❌ Erro ao preparar aplicação Next.js:', err);
        process.exit(1);
    });
} 