// Script que simula exatamente o comportamento do frontend
const WebSocket = require('ws');

console.log('🔍 Simulando exatamente o comportamento do frontend...');

// Simular o estado do React
let opportunities = [];
let maxOpportunities = 50; // Valor que configuramos

const ws = new WebSocket('ws://localhost:10000');

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket server');
  
  // Enviar mensagem de identificação como o frontend faz
  ws.send(JSON.stringify({
    type: 'client-connect',
    client: 'arbitrage-app',
    timestamp: Date.now()
  }));
});

// Função que simula exatamente o updateOpportunities do hook
function updateOpportunities(newOpportunity) {
  console.log('[Frontend Sim] 🔄 Atualizando oportunidades:', newOpportunity.baseSymbol, newOpportunity.profitPercentage, '%');
  
  // Remove se já existe (mesmo baseSymbol e arbitrageType)
  const filtered = opportunities.filter(
    p => !(p.baseSymbol === newOpportunity.baseSymbol && p.arbitrageType === newOpportunity.arbitrageType)
  );
  console.log('[Frontend Sim] 📊 Após filtro:', filtered.length, 'oportunidades');
  
  // Adiciona a nova oportunidade
  const updated = [...filtered, newOpportunity];
  console.log('[Frontend Sim] 📊 Após adicionar:', updated.length, 'oportunidades');
  
  // Ordena por spread decrescente
  updated.sort((a, b) => b.profitPercentage - a.profitPercentage);
  
  // Limita ao máximo configurado
  const result = updated.slice(0, maxOpportunities);
  console.log('[Frontend Sim] 📊 Após slice:', result.length, 'oportunidades (limite:', maxOpportunities, ')');
  
  // DEBUG: Verificar se WHITE_USDT está na lista final
  const whiteInResult = result.find(opp => opp.baseSymbol === 'WHITE_USDT');
  if (whiteInResult) {
    console.log('[Frontend Sim] ✅ WHITE_USDT na lista final:', whiteInResult.profitPercentage, '%');
  } else {
    console.log('[Frontend Sim] ❌ WHITE_USDT não está na lista final');
    
    // DEBUG: Verificar se estava na lista antes do slice
    const whiteBeforeSlice = updated.find(opp => opp.baseSymbol === 'WHITE_USDT');
    if (whiteBeforeSlice) {
      console.log('[Frontend Sim] 🔍 WHITE_USDT estava na lista antes do slice (posição:', updated.indexOf(whiteBeforeSlice) + 1, 'de', updated.length, ')');
      console.log('[Frontend Sim] 🔍 maxOpportunities:', maxOpportunities);
      console.log('[Frontend Sim] 🔍 WHITE_USDT foi removida pelo limite de oportunidades');
    }
  }
  
  opportunities = result;
}

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'arbitrage') {
      console.log('[Frontend Sim] 📨 Mensagem arbitrage recebida:', message.baseSymbol, message.profitPercentage, '%');
      
      // DEBUG: Verificar se é WHITE_USDT
      if (message.baseSymbol === 'WHITE_USDT') {
        console.log('[Frontend Sim] 🎯 WHITE_USDT detectada! Spread:', message.profitPercentage, '%');
      }
      
      updateOpportunities(message);
    }
    
  } catch (error) {
    console.error('[Frontend Sim] Erro ao processar mensagem:', error.message);
  }
});

ws.on('close', () => {
  console.log('\n🔌 Conexão fechada');
  console.log(`📊 Resumo final:`);
  console.log(`   Oportunidades no estado final: ${opportunities.length}`);
  
  const whiteInFinal = opportunities.find(opp => opp.baseSymbol === 'WHITE_USDT');
  if (whiteInFinal) {
    console.log(`✅ WHITE_USDT está no estado final: ${whiteInFinal.profitPercentage}%`);
  } else {
    console.log('❌ WHITE_USDT NÃO está no estado final!');
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

// Timeout após 30 segundos
setTimeout(() => {
  console.log('\n⏰ Timeout - Fechando conexão...');
  ws.close();
}, 30000); 