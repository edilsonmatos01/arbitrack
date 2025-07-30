const WebSocket = require('ws');

console.log('🧪 Teste de Processamento de Oportunidades na Interface');
console.log('=' .repeat(60));

const ws = new WebSocket('ws://localhost:10000');

let opportunitiesReceived = 0;
let opportunitiesProcessed = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Conectado ao servidor WebSocket');
  console.log('⏱️  Aguardando oportunidades...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    
    if (message.type === 'opportunity') {
      opportunitiesReceived++;
      
      // Simular o processamento da interface
      const spread = message.spread;
      const minSpread = 0.01; // Mesmo valor da interface
      
      console.log(`🎯 OPORTUNIDADE #${opportunitiesReceived}:`);
      console.log(`   Símbolo: ${message.symbol}`);
      console.log(`   Spread: ${spread.toFixed(3)}%`);
      console.log(`   Compra: ${message.exchangeBuy} @ ${message.spotPrice}`);
      console.log(`   Venda: ${message.exchangeSell} @ ${message.futuresPrice}`);
      console.log(`   Direção: ${message.direction}`);
      
      // Verificar se seria exibida na interface
      if (spread > 0 && spread >= minSpread) {
        opportunitiesProcessed++;
        console.log(`   ✅ SERIA EXIBIDA na interface (spread ${spread.toFixed(3)}% >= ${minSpread}%)`);
      } else {
        console.log(`   ❌ NÃO seria exibida na interface:`);
        if (spread <= 0) {
          console.log(`      - Spread ${spread.toFixed(3)}% <= 0`);
        }
        if (spread < minSpread) {
          console.log(`      - Spread ${spread.toFixed(3)}% < mínimo ${minSpread}%`);
        }
      }
      console.log('');
    }
    
    // Parar após 10 segundos
    if (Date.now() - startTime > 10000) {
      console.log('📊 RESULTADOS DO TESTE:');
      console.log(`⏱️  Duração: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
      console.log(`🎯 Oportunidades recebidas: ${opportunitiesReceived}`);
      console.log(`✅ Oportunidades que seriam exibidas: ${opportunitiesProcessed}`);
      console.log(`❌ Oportunidades filtradas: ${opportunitiesReceived - opportunitiesProcessed}`);
      
      if (opportunitiesProcessed > 0) {
        console.log('\n✅ SUCESSO: Oportunidades válidas estão sendo geradas!');
        console.log('💡 Se não aparecem na interface, verifique:');
        console.log('   1. Se o WebSocket está conectado na interface');
        console.log('   2. Se há erros no console do navegador');
        console.log('   3. Se o componente está renderizando corretamente');
      } else {
        console.log('\n⚠️  ATENÇÃO: Nenhuma oportunidade válida encontrada.');
        console.log('💡 Verifique se o worker está gerando spreads >= 0.01%');
      }
      
      ws.close();
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro de WebSocket:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
}); 