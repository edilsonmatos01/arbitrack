const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 INICIANDO WORKER DE COLETA DE DADOS');
console.log('=====================================\n');

// Caminho para o worker
let workerPath = path.join(__dirname, 'background-worker.js');

console.log(`📁 Caminho do worker: ${workerPath}`);

// Verificar se o arquivo existe
const fs = require('fs');
if (!fs.existsSync(workerPath)) {
  console.error('❌ Arquivo do worker não encontrado!');
  console.log('Procurando por arquivos alternativos...');
  
  const possiblePaths = [
    path.join(__dirname, '..', 'worker', 'background-worker.js'),
    path.join(__dirname, '..', 'scripts', 'background-worker.ts'),
    path.join(__dirname, '..', 'scripts', 'background-worker.js')
  ];
  
  for (const altPath of possiblePaths) {
    if (fs.existsSync(altPath)) {
      console.log(`✅ Encontrado: ${altPath}`);
      workerPath = altPath;
      break;
    }
  }
}

// Função para iniciar o worker
function startWorker() {
  console.log('🔄 Iniciando worker...');
  
  // Usar node para executar JavaScript
  const worker = spawn('node', [workerPath], {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  worker.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[WORKER] ${output.trim()}`);
    
    // Verificar se o worker está funcionando
    if (output.includes('Worker iniciado') || output.includes('WebSocket estabelecida')) {
      console.log('✅ Worker iniciado com sucesso!');
    }
  });

  worker.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`[WORKER ERROR] ${error.trim()}`);
  });

  worker.on('close', (code) => {
    console.log(`[WORKER] Processo finalizado com código ${code}`);
    if (code !== 0) {
      console.log('🔄 Reiniciando worker em 5 segundos...');
      setTimeout(startWorker, 5000);
    }
  });

  worker.on('error', (error) => {
    console.error('[WORKER] Erro ao iniciar worker:', error);
  });

  // Tratamento de sinais para encerramento limpo
  process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando worker...');
    worker.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando worker...');
    worker.kill('SIGTERM');
    process.exit(0);
  });

  return worker;
}

// Verificar se já há um worker rodando
const { exec } = require('child_process');
exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout) => {
  if (error) {
    console.log('⚠️  Não foi possível verificar processos Node.js');
    startWorker();
    return;
  }

  const lines = stdout.split('\n');
  const nodeProcesses = lines.filter(line => line.includes('node.exe'));
  
  console.log(`📊 Processos Node.js encontrados: ${nodeProcesses.length}`);
  
  if (nodeProcesses.length > 3) {
    console.log('⚠️  Muitos processos Node.js rodando. Verificando se há worker...');
    
    // Tentar encontrar worker específico
    exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /V', (error2, stdout2) => {
      if (stdout2.includes('background-worker') || stdout2.includes('worker')) {
        console.log('✅ Worker já está rodando!');
        console.log('💡 Para ver os logs, verifique o terminal onde o worker foi iniciado.');
      } else {
        console.log('🔄 Iniciando novo worker...');
        startWorker();
      }
    });
  } else {
    console.log('🔄 Iniciando worker...');
    startWorker();
  }
});

console.log('\n📋 INSTRUÇÕES:');
console.log('1. O worker irá coletar dados das exchanges');
console.log('2. Os dados serão salvos no banco de dados');
console.log('3. Os gráficos devem começar a funcionar');
console.log('4. Pressione Ctrl+C para parar o worker');
console.log('\n⏳ Aguardando inicialização...\n'); 