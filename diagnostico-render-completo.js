const https = require('https');
const http = require('http');

console.log('🔍 DIAGNÓSTICO COMPLETO DOS SERVIÇOS RENDER\n');

// Lista de serviços para testar
const services = [
  {
    name: 'arbitrage-worker',
    url: 'https://arbitrage-worker.onrender.com',
    expectedPort: 10001,
    type: 'worker'
  },
  {
    name: 'arbitragem-render',
    url: 'https://arbitragem-render.onrender.com',
    expectedPort: 10000,
    type: 'frontend'
  },
  {
    name: 'robo-de-arbitragem',
    url: 'https://robo-de-arbitragem.onrender.com',
    expectedPort: 10000,
    type: 'frontend'
  },
  {
    name: 'robo-de-arbitragem-tracker',
    url: 'https://robo-de-arbitragem-tracker.onrender.com',
    expectedPort: 10000,
    type: 'frontend'
  }
];

// Função para testar HTTP/HTTPS
function testHTTP(url, path = '/') {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.get(url + path, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        error: err.message,
        success: false
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        error: 'Timeout (10s)',
        success: false
      });
    });
  });
}

// Função para testar WebSocket
function testWebSocket(url) {
  return new Promise((resolve) => {
    const WebSocket = require('ws');
    const ws = new WebSocket(url);
    
    let connected = false;
    let error = null;
    
    ws.on('open', () => {
      connected = true;
      ws.close();
    });
    
    ws.on('error', (err) => {
      error = err.message;
    });
    
    ws.on('close', () => {
      resolve({
        connected,
        error,
        success: connected
      });
    });
    
    setTimeout(() => {
      if (!connected) {
        ws.terminate();
        resolve({
          connected: false,
          error: 'Timeout (5s)',
          success: false
        });
      }
    }, 5000);
  });
}

// Testar um serviço completo
async function testService(service) {
  console.log(`📡 Testando: ${service.name} (${service.url})`);
  console.log(`🎯 Tipo: ${service.type.toUpperCase()}`);
  console.log(`🔌 Porta esperada: ${service.expectedPort}`);
  console.log('─'.repeat(60));
  
  // Teste 1: Health Check
  console.log('1️⃣ Testando Health Check...');
  const healthResult = await testHTTP(service.url, '/health');
  if (healthResult.success) {
    console.log(`✅ Health Check: ${healthResult.status}`);
    try {
      const json = JSON.parse(healthResult.data);
      console.log(`📊 Dados:`, JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(`📄 Resposta: ${healthResult.data.substring(0, 200)}...`);
    }
  } else {
    console.log(`❌ Health Check: ${healthResult.error || healthResult.status}`);
  }
  
  // Teste 2: Página Principal
  console.log('\n2️⃣ Testando Página Principal...');
  const mainResult = await testHTTP(service.url, '/');
  if (mainResult.success) {
    console.log(`✅ Página Principal: ${mainResult.status}`);
    console.log(`📄 Tipo: ${mainResult.headers['content-type'] || 'N/A'}`);
    if (mainResult.data.includes('html')) {
      console.log(`🌐 Página HTML detectada`);
    } else if (mainResult.data.includes('json')) {
      console.log(`📊 Resposta JSON detectada`);
    } else {
      console.log(`📄 Conteúdo: ${mainResult.data.substring(0, 100)}...`);
    }
  } else {
    console.log(`❌ Página Principal: ${mainResult.error || mainResult.status}`);
  }
  
  // Teste 3: WebSocket (apenas para worker)
  if (service.type === 'worker') {
    console.log('\n3️⃣ Testando WebSocket...');
    const wsUrl = service.url.replace('https://', 'wss://');
    const wsResult = await testWebSocket(wsUrl);
    if (wsResult.success) {
      console.log(`✅ WebSocket: Conectado com sucesso`);
    } else {
      console.log(`❌ WebSocket: ${wsResult.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Testar todos os serviços
async function runDiagnostic() {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...\n');
  
  for (const service of services) {
    await testService(service);
  }
  
  console.log('🎯 RESUMO DO DIAGNÓSTICO:');
  console.log('─'.repeat(40));
  console.log('1. Verifique os logs de cada serviço no dashboard da Render');
  console.log('2. Confirme as configurações de Build e Start Command');
  console.log('3. Verifique as variáveis de ambiente');
  console.log('4. Teste novamente após correções');
  console.log('\n📋 Para mais detalhes, consulte: CORRECAO_SERVICOS_RENDER.md');
}

runDiagnostic(); 