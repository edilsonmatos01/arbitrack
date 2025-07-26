// Carregar variáveis de ambiente
require('dotenv').config();

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '10000', 10);

// Log das configurações
console.log('Configurações do servidor:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: port,
  HOSTNAME: hostname,
  DATABASE_URL: process.env.DATABASE_URL ? 'Configurada' : 'Não configurada'
});

// Quando estiver em produção, use o build standalone
if (!dev) {
    const standaloneServer = require('./.next/standalone/server.js');
    console.log(`> Usando servidor standalone na porta ${port}`);
} else {
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    app.prepare().then(() => {
        createServer(async (req, res) => {
            try {
                const parsedUrl = parse(req.url, true);
                await handle(req, res, parsedUrl);
            } catch (err) {
                console.error('Error occurred handling', req.url, err);
                res.statusCode = 500;
                res.end('internal server error');
            }
        })
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, hostname, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
    });
} 