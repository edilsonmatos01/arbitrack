const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function safeWebBuild() {
    try {
        console.log('🔧 Iniciando build seguro para aplicação web...');
        console.log('📋 Node version:', process.version);
        console.log('📋 NPM version:', await getNpmVersion());
        
        // 1. Limpar cache do npm se necessário
        console.log('🧹 Limpando cache do npm...');
        try {
            await execAsync('npm cache clean --force');
            console.log('✅ Cache limpo');
        } catch (cacheError) {
            console.log('⚠️  Erro ao limpar cache (continuando):', cacheError.message);
        }
        
        // 2. Instalar dependências
        console.log('📦 Instalando dependências...');
        await execAsync('npm install --production=false');
        console.log('✅ Dependências instaladas');
        
        // 3. Gerar Prisma Client
        console.log('📦 Gerando Prisma Client...');
        await execAsync('npx prisma generate');
        console.log('✅ Prisma Client gerado com sucesso');
        
        // 4. Build do Next.js
        console.log('🏗️  Fazendo build do Next.js...');
        await execAsync('npx next build');
        console.log('✅ Build do Next.js concluído com sucesso');
        
        console.log('🎉 Build seguro da web concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante o build:', error.message);
        console.error('❌ Stack trace:', error.stack);
        
        // Se falhar, tenta uma abordagem mais básica
        console.log('🔄 Tentando abordagem alternativa...');
        try {
            console.log('📦 Tentando build básico do Next.js...');
            await execAsync('npx next build --debug');
            console.log('✅ Build alternativo bem-sucedido');
        } catch (fallbackError) {
            console.error('❌ Falha no build alternativo:', fallbackError.message);
            console.error('❌ Stack trace alternativo:', fallbackError.stack);
            process.exit(1);
        }
    }
}

async function getNpmVersion() {
    try {
        const { stdout } = await execAsync('npm --version');
        return stdout.trim();
    } catch (error) {
        return 'unknown';
    }
}

if (require.main === module) {
    safeWebBuild()
        .then(() => {
            console.log('🎉 Build concluído com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Build falhou:', error);
            process.exit(1);
        });
}

module.exports = { safeWebBuild }; 