const fetch = require('node-fetch');

async function testPositionPnLAlerts() {
  console.log('🔔 Testando sistema de alertas de PnL de posições...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('📊 Testando criação de posição simulada...');
    
    // 1. Criar uma posição simulada
    const positionData = {
      symbol: 'TEST_USDT',
      quantity: 1000,
      spotEntry: 0.001,
      futuresEntry: 0.0012,
      spotExchange: 'gateio',
      futuresExchange: 'mexc',
      isSimulated: true
    };
    
    const createResponse = await fetch(`${baseUrl}/api/positions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(positionData),
    });
    
    if (!createResponse.ok) {
      throw new Error(`Erro ao criar posição: ${createResponse.status}`);
    }
    
    const newPosition = await createResponse.json();
    console.log('✅ Posição criada:', newPosition.id);
    
    // 2. Verificar se a posição foi criada
    const getResponse = await fetch(`${baseUrl}/api/positions?user_id=edilsonmatos`);
    if (!getResponse.ok) {
      throw new Error(`Erro ao buscar posições: ${getResponse.status}`);
    }
    
    const positions = await getResponse.json();
    console.log(`📋 Total de posições: ${positions.length}`);
    
    // 3. Simular diferentes cenários de PnL
    console.log('\n🎯 Simulando cenários de PnL:');
    
    const scenarios = [
      { pnlPercent: 0.25, description: 'PnL baixo (0.25%) - Não deve alertar' },
      { pnlPercent: 0.50, description: 'PnL threshold 1 (0.50%) - Deve alertar' },
      { pnlPercent: 0.75, description: 'PnL entre thresholds (0.75%) - Não deve alertar novamente' },
      { pnlPercent: 1.00, description: 'PnL threshold 2 (1.00%) - Deve alertar' },
      { pnlPercent: 1.50, description: 'PnL entre thresholds (1.50%) - Não deve alertar novamente' },
      { pnlPercent: 2.00, description: 'PnL threshold 3 (2.00%) - Deve alertar' },
      { pnlPercent: 3.00, description: 'PnL alto (3.00%) - Não deve alertar novamente' },
    ];
    
    scenarios.forEach((scenario, index) => {
      console.log(`\n${index + 1}. ${scenario.description}`);
      console.log(`   PnL: ${scenario.pnlPercent}%`);
      
      if (scenario.pnlPercent === 0.50 || scenario.pnlPercent === 1.00 || scenario.pnlPercent === 2.00) {
        console.log('   🎯 ALERTA ESPERADO: Som alerta2.mp3 + Toast notification');
      } else {
        console.log('   ⏸️ Sem alerta esperado');
      }
    });
    
    console.log('\n📝 INSTRUÇÕES PARA TESTE MANUAL:');
    console.log('1. Acesse http://localhost:3000/arbitragem');
    console.log('2. Crie uma posição simulada');
    console.log('3. Clique no ícone de sino ao lado da posição para ativar alertas');
    console.log('4. Monitore os alertas quando PnL atingir 0.50%, 1% e 2%');
    console.log('5. Verifique se o som alerta2.mp3 toca e notificações aparecem');
    
    // 4. Limpar posição de teste
    console.log('\n🧹 Limpando posição de teste...');
    const deleteResponse = await fetch(`${baseUrl}/api/positions?id=${newPosition.id}`, {
      method: 'DELETE',
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Posição de teste removida');
    } else {
      console.log('⚠️ Erro ao remover posição de teste');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testPositionPnLAlerts(); 