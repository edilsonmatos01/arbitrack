const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 INSTALAÇÃO FORÇADA DE DEPENDÊNCIAS\n');

// 1. Remover node_modules se existir
if (fs.existsSync('node_modules')) {
    console.log('🗑️  Removendo node_modules existente...');
    try {
        execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
        console.log('✅ node_modules removido');
    } catch (error) {
        console.log('⚠️  Erro ao remover node_modules (pode não existir)');
    }
}

// 2. Remover package-lock.json se existir
if (fs.existsSync('package-lock.json')) {
    console.log('🗑️  Removendo package-lock.json...');
    fs.unlinkSync('package-lock.json');
    console.log('✅ package-lock.json removido');
}

// 3. Limpar cache do npm
console.log('🧹 Limpando cache do npm...');
try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ Cache limpo');
} catch (error) {
    console.log('⚠️  Erro ao limpar cache');
}

// 4. Instalar dependências
console.log('📦 Instalando dependências...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependências instaladas');
} catch (error) {
    console.log('❌ Erro na instalação');
    process.exit(1);
}

// 5. Verificar instalação
console.log('\n🔍 Verificando instalação...');
if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules criado');
    
    // Verificar alguns pacotes essenciais
    const essentialPackages = [
        'next',
        'react',
        'react-dom',
        'ws',
        '@prisma/client'
    ];
    
    essentialPackages.forEach(pkg => {
        const pkgPath = `node_modules/${pkg}`;
        if (fs.existsSync(pkgPath)) {
            console.log(`✅ ${pkg} instalado`);
        } else {
            console.log(`❌ ${pkg} NÃO instalado`);
        }
    });
} else {
    console.log('❌ node_modules não foi criado');
}

// 6. Gerar package-lock.json
if (!fs.existsSync('package-lock.json')) {
    console.log('📝 Gerando package-lock.json...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ package-lock.json gerado');
    } catch (error) {
        console.log('❌ Erro ao gerar package-lock.json');
    }
}

console.log('\n🎯 CONFIGURAÇÃO PARA RENDER:');
console.log('📝 Build Command: npm ci && npm run build');
console.log('🚀 Start Command: npm start');
console.log('');
console.log('✅ Instalação concluída!'); 