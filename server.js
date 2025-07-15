const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '10000', 10);

console.log(`🚀 Iniciando servidor em modo ${dev ? 'desenvolvimento' : 'produção'}`);
console.log(`📍 Hostname: ${hostname}`);
console.log(`🔌 Porta: ${port}`);

// Em produção, usar o servidor standalone do Next.js
if (!dev) {
    try {
        console.log('📦 Carregando servidor standalone...');
        const standaloneServer = require('./.next/standalone/server.js');
        console.log('✅ Servidor standalone carregado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao carregar servidor standalone:', error.message);
        console.log('🔄 Fallback para servidor Next.js padrão...');
        
        // Fallback para servidor Next.js padrão
        const app = next({ dev: false, hostname, port });
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
} else {
    // Modo desenvolvimento
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
            console.log(`✅ Servidor desenvolvimento rodando em http://${hostname}:${port}`);
            console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    }).catch((err) => {
        console.error('❌ Erro ao preparar aplicação Next.js:', err);
        process.exit(1);
    });
} 