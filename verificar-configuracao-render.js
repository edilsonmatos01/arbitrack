const fs = require('fs');

console.log('🔍 VERIFICAÇÃO DE CONFIGURAÇÃO PARA RENDER\n');

// 1. Verificar package.json
console.log('📦 Verificando package.json...');
if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`✅ Nome: ${packageJson.name}`);
    console.log(`✅ Versão: ${packageJson.version}`);
    
    // Verificar scripts
    if (packageJson.scripts.build) {
        console.log(`✅ Build script: ${packageJson.scripts.build}`);
    } else {
        console.log('❌ Build script não encontrado!');
    }
    
    if (packageJson.scripts.start) {
        console.log(`✅ Start script: ${packageJson.scripts.start}`);
    } else {
        console.log('❌ Start script não encontrado!');
    }
} else {
    console.log('❌ package.json não encontrado!');
}

// 2. Verificar se pnpm-lock.yaml existe
console.log('\n🔒 Verificando lockfiles...');
if (fs.existsSync('pnpm-lock.yaml')) {
    console.log('❌ pnpm-lock.yaml ainda existe! Deve ser removido.');
} else {
    console.log('✅ pnpm-lock.yaml não existe (correto).');
}

if (fs.existsSync('package-lock.json')) {
    console.log('✅ package-lock.json existe (correto).');
} else {
    console.log('⚠️  package-lock.json não existe. Execute: npm install');
}

// 3. Verificar arquivos essenciais
console.log('\n📋 Verificando arquivos essenciais...');
const essentialFiles = [
    'next.config.js',
    'worker/background-worker-fixed.js',
    'render.yaml'
];

essentialFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - FALTANDO!`);
    }
});

// 4. Verificar next.config.js
console.log('\n⚙️  Verificando next.config.js...');
if (fs.existsSync('next.config.js')) {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    if (nextConfig.includes('eslint: { ignoreDuringBuilds: true }')) {
        console.log('✅ ESLint ignorado durante build (correto).');
    } else {
        console.log('⚠️  ESLint não está configurado para ignorar builds.');
    }
    
    if (nextConfig.includes('typescript: { ignoreBuildErrors: true }')) {
        console.log('✅ TypeScript ignorado durante build (correto).');
    } else {
        console.log('⚠️  TypeScript não está configurado para ignorar builds.');
    }
}

// 5. Instruções finais
console.log('\n🎯 CONFIGURAÇÕES CORRETAS PARA RENDER:');
console.log('');
console.log('📝 Build Command: npm install && npm run build');
console.log('🚀 Start Command: npm start');
console.log('🔌 Port: 10000');
console.log('🌐 Environment: production');
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('1. No Render Dashboard, vá em arbitragem-frontend > Settings');
console.log('2. Mude Build Command para: npm install && npm run build');
console.log('3. Mude Start Command para: npm start');
console.log('4. Clique em "Save Changes"');
console.log('5. Faça "Manual Deploy" com "Clear build cache"');
console.log('');
console.log('✅ Verificação concluída!'); 