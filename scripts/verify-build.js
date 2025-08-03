const fs = require('fs');
const path = require('path');

function verifyBuild() {
  console.log('🔍 Verificando build do projeto...\n');

  // Verificar se o diretório .next existe
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    console.log('✅ Diretório .next encontrado');
    
    // Verificar se o servidor standalone foi gerado
    const standaloneDir = path.join(nextDir, 'standalone');
    if (fs.existsSync(standaloneDir)) {
      console.log('✅ Servidor standalone gerado');
      
      const serverFile = path.join(standaloneDir, 'server.js');
      if (fs.existsSync(serverFile)) {
        console.log('✅ Arquivo server.js encontrado');
      } else {
        console.log('❌ Arquivo server.js não encontrado');
      }
    } else {
      console.log('❌ Servidor standalone não foi gerado');
    }
  } else {
    console.log('❌ Diretório .next não encontrado');
  }

  // Verificar se o diretório dist existe (para o worker)
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    console.log('✅ Diretório dist encontrado');
    
    const files = fs.readdirSync(distDir);
    console.log(`📁 Arquivos em dist: ${files.join(', ')}`);
  } else {
    console.log('❌ Diretório dist não encontrado');
  }

  // Verificar package.json
  const packageJson = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJson)) {
    console.log('✅ package.json encontrado');
    
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    console.log(`📦 Scripts disponíveis: ${Object.keys(pkg.scripts).join(', ')}`);
  }

  // Verificar server.js
  const serverFile = path.join(process.cwd(), 'server.js');
  if (fs.existsSync(serverFile)) {
    console.log('✅ server.js encontrado');
  } else {
    console.log('❌ server.js não encontrado');
  }

  console.log('\n🔧 Para corrigir problemas:');
  console.log('1. Execute: npm run build');
  console.log('2. Execute: npm run build:worker');
  console.log('3. Verifique se os diretórios .next e dist foram criados');
}

verifyBuild(); 