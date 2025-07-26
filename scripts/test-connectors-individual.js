const { GateIoConnector } = require('./connectors/dist/gateio-connector');
const { MexcConnector } = require('./connectors/dist/mexc-connector');

// Lista de pares para teste
const TEST_PAIRS = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT'];

// Função para testar Gate.io
async function testGateioConnector() {
  console.log('\n🔍 TESTANDO CONECTOR GATE.IO');
  console.log('============================');
  
  const gateio = new GateIoConnector('GATEIO_SPOT', (data) => {
    console.log(`✅ Gate.io - ${data.symbol}: Ask $${data.bestAsk}, Bid $${data.bestBid}`);
  });

  try {
    // Testar busca de pares negociáveis
    console.log('📡 Buscando pares negociáveis...');
    const pairs = await gateio.getTradablePairs();
    console.log(`✅ Gate.io: ${pairs.length} pares encontrados`);
    
    if (pairs.length > 0) {
      console.log('📋 Primeiros 5 pares:', pairs.slice(0, 5));
    }

    // Testar conexão WebSocket
    console.log('\n🌐 Testando conexão WebSocket...');
    const testPairs = TEST_PAIRS.map(p => p.replace('_', '/'));
    gateio.connect(testPairs);

    // Aguardar 10 segundos para receber dados
    setTimeout(() => {
      console.log('⏰ Teste Gate.io concluído');
      gateio.disconnect();
    }, 10000);

  } catch (error) {
    console.error('❌ Erro no teste Gate.io:', error);
  }
}

// Função para testar MEXC
async function testMexcConnector() {
  console.log('\n🔍 TESTANDO CONECTOR MEXC');
  console.log('==========================');
  
  const mexc = new MexcConnector('MEXC_SPOT', (data) => {
    console.log(`✅ MEXC - ${data.symbol}: Ask $${data.bestAsk}, Bid $${data.bestBid}`);
  }, () => {
    console.log('✅ MEXC conectado com sucesso');
  });

  try {
    // Testar busca de pares negociáveis
    console.log('📡 Buscando pares negociáveis...');
    const pairs = await mexc.getTradablePairs();
    console.log(`✅ MEXC: ${pairs.length} pares encontrados`);
    
    if (pairs.length > 0) {
      console.log('📋 Primeiros 5 pares:', pairs.slice(0, 5));
    }

    // Testar conexão WebSocket
    console.log('\n🌐 Testando conexão WebSocket...');
    mexc.connect();
    
    // Aguardar 2 segundos e então subscrever
    setTimeout(() => {
      const testPairs = TEST_PAIRS.map(p => p.replace('_', '/'));
      mexc.subscribe(testPairs);
    }, 2000);

    // Aguardar 10 segundos para receber dados
    setTimeout(() => {
      console.log('⏰ Teste MEXC concluído');
      mexc.disconnect();
    }, 10000);

  } catch (error) {
    console.error('❌ Erro no teste MEXC:', error);
  }
}

// Função principal
async function testAllConnectors() {
  console.log('🚀 INICIANDO TESTES DOS CONECTORES');
  console.log('==================================');
  
  // Testar Gate.io primeiro
  await testGateioConnector();
  
  // Aguardar 2 segundos entre os testes
  setTimeout(async () => {
    await testMexcConnector();
    
    // Finalizar após todos os testes
    setTimeout(() => {
      console.log('\n✅ TODOS OS TESTES CONCLUÍDOS');
      process.exit(0);
    }, 5000);
  }, 2000);
}

// Executar testes
testAllConnectors().catch(console.error); 