const fs = require('fs');

console.log('🔧 CORREÇÃO PARA BUILD NO RENDER\n');

// 1. Verificar se package-lock.json existe
if (fs.existsSync('package-lock.json')) {
    console.log('✅ package-lock.json existe');
} else {
    console.log('❌ package-lock.json não existe - Execute: npm install');
}

// 2. Verificar se pnpm-lock.yaml existe
if (fs.existsSync('pnpm-lock.yaml')) {
    console.log('❌ pnpm-lock.yaml ainda existe - Deve ser removido');
} else {
    console.log('✅ pnpm-lock.yaml não existe (correto)');
}

// 3. Verificar package.json
if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`✅ package.json: ${packageJson.name} v${packageJson.version}`);
    
    if (packageJson.scripts.build) {
        console.log(`✅ Build script: ${packageJson.scripts.build}`);
    }
    
    if (packageJson.scripts.start) {
        console.log(`✅ Start script: ${packageJson.scripts.start}`);
    }
}

console.log('\n🎯 CONFIGURAÇÃO CORRETA PARA RENDER:');
console.log('');
console.log('📝 Build Command: npm ci && npm run build');
console.log('🚀 Start Command: npm start');
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('1. No Render Dashboard, vá em arbitragem-frontend > Settings');
console.log('2. Mude Build Command para: npm ci && npm run build');
console.log('3. Mude Start Command para: npm start');
console.log('4. Clique em "Save Changes"');
console.log('5. Faça "Manual Deploy" com "Clear build cache"');
console.log('');
console.log('💡 DICA: npm ci é mais rápido e confiável que npm install para produção');
console.log('');
console.log('✅ Verificação concluída!'); 