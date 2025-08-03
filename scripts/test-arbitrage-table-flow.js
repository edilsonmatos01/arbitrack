const WebSocket = require('ws');
const fetch = require('node-fetch');

// Configurações
const WORKER_WS_URL = 'ws://localhost:10000';
const FRONTEND_URL = 'http://localhost:3000';
const MIN_SPREAD_THRESHOLD = 0.1; // 0.1% para filtrar ruído

console.log('🧪 TESTE DO FLUXO COMPLETO - ARBITRAGEM TABLE');
console.log('==============================================');

// Teste 1: Verificar se o Worker está rodando
async function testWorkerConnection() {
  console.log('\n🔌 Teste 1: Verificando conexão com Worker...');
  
  try {
    const response = await fetch('http://localhost:10000');
    const data = await response.json();
    console.log('✅ Worker está rodando:', data);
    return true;
  } catch (error) {
    console.log('❌ Worker não está rodando:', error.message);
    return false;
  }
}

// Teste 2: Conectar ao WebSocket do Worker
async function testWorkerWebSocket() {
  console.log('\n🔌 Teste 2: Conectando ao WebSocket do Worker...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(WORKER_WS_URL);
    
    ws.on('open', () => {
      console.log('✅ Conectado ao WebSocket do Worker!');
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Mensagem recebida do Worker:', JSON.stringify(message, null, 2));
        
        if (message.type === 'arbitrage') {
          console.log('🎯 OPORTUNIDADE ENCONTRADA NA TABELA!');
          console.log('   Símbolo:', message.baseSymbol);
          console.log('   Spread:', message.profitPercentage.toFixed(4) + '%');
          console.log('   Compra:', message.buyAt.exchange, '@', message.buyAt.price);
          console.log('   Venda:', message.sellAt.exchange, '@', message.sellAt.price);
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ Erro no WebSocket:', error.message);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket fechado');
    });

    // Aguardar 30 segundos para receber oportunidades
    setTimeout(() => {
      ws.close();
      resolve();
    }, 30000);
  });
}

// Teste 3: Verificar API de oportunidades
async function testOpportunitiesAPI() {
  console.log('\n🔌 Teste 3: Verificando API de oportunidades...');
  
  try {
    const response = await fetch(`${FRONTEND_URL}/api/arbitrage/all-opportunities`);
    const data = await response.json();
    
    console.log('📊 Oportunidades na API:', data.length);
    if (data.length > 0) {
      console.log('🎯 Primeira oportunidade:');
      console.log('   Símbolo:', data[0].baseSymbol);
      console.log('   Spread:', data[0].profitPercentage.toFixed(4) + '%');
      console.log('   Timestamp:', new Date(data[0].timestamp).toLocaleString());
    }
    
    return data.length > 0;
  } catch (error) {
    console.log('❌ Erro ao acessar API:', error.message);
    return false;
  }
}

// Teste 4: Verificar dados de spread
async function testSpreadData() {
  console.log('\n🔌 Teste 4: Verificando dados de spread...');
  
  try {
    const response = await fetch(`${FRONTEND_URL}/api/spreads/max`);
    const data = await response.json();
    
    console.log('📊 Dados de spread encontrados:', data.length);
    if (data.length > 0) {
      console.log('📈 Maior spread:', data[0].symbol, data[0].maxSpread.toFixed(4) + '%');
    }
    
    return data.length > 0;
  } catch (error) {
    console.log('❌ Erro ao acessar dados de spread:', error.message);
    return false;
  }
}

// Teste 5: Simular dados de arbitragem
async function simulateArbitrageData() {
  console.log('\n🔌 Teste 5: Simulando dados de arbitragem...');
  
  const testOpportunity = {
    type: 'arbitrage',
    baseSymbol: 'TEST',
    profitPercentage: 0.5,
    buyAt: {
      exchange: 'gateio',
      price: 100,
      marketType: 'spot'
    },
    sellAt: {
      exchange: 'mexc',
      price: 100.5,
      marketType: 'futures'
    },
    arbitrageType: 'spot_to_futures',
    timestamp: Date.now()
  };

  try {
    const response = await fetch(`${FRONTEND_URL}/api/arbitrage/all-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOpportunity)
    });
    
    console.log('✅ Dados de teste enviados');
    return true;
  } catch (error) {
    console.log('❌ Erro ao enviar dados de teste:', error.message);
    return false;
  }
}

// Função principal
async function runCompleteTest() {
  console.log('🚀 Iniciando teste completo do fluxo...\n');
  
  // Teste 1: Worker
  const workerRunning = await testWorkerConnection();
  
  if (!workerRunning) {
    console.log('\n❌ Worker não está rodando. Inicie o worker primeiro.');
    console.log('   Comando: node worker/background-worker.ts');
    return;
  }
  
  // Teste 2: WebSocket
  await testWorkerWebSocket();
  
  // Teste 3: API
  const hasOpportunities = await testOpportunitiesAPI();
  
  // Teste 4: Spread Data
  const hasSpreadData = await testSpreadData();
  
  // Teste 5: Simulação
  await simulateArbitrageData();
  
  // Resumo
  console.log('\n📊 RESUMO DO TESTE:');
  console.log('===================');
  console.log('✅ Worker:', workerRunning ? 'Rodando' : 'Parado');
  console.log('✅ WebSocket:', 'Testado');
  console.log('✅ API Oportunidades:', hasOpportunities ? 'Com dados' : 'Sem dados');
  console.log('✅ Dados de Spread:', hasSpreadData ? 'Com dados' : 'Sem dados');
  console.log('✅ Simulação:', 'Concluída');
  
  if (hasOpportunities || hasSpreadData) {
    console.log('\n🎉 SUCESSO: Oportunidades estão chegando até a tabela!');
  } else {
    console.log('\n⚠️  ATENÇÃO: Nenhuma oportunidade encontrada na tabela.');
    console.log('   Verifique se o worker está processando dados corretamente.');
  }
  
  console.log('\n🏁 TESTE CONCLUÍDO');
}

// Executar teste
runCompleteTest().catch(console.error); 