// Script para testar a performance da API de dados
const fetch = require('node-fetch');

async function testApiPerformance() {
  console.log('🧪 Testando Performance da API...');
  
  try {
    const startTime = Date.now();
    
    console.log('📡 Fazendo requisição para /api/init-data-simple...');
    const response = await fetch('http://localhost:3000/api/init-data-simple?user_id=edilsonmatos');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Tempo de resposta: ${duration}ms`);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n📈 Dados Recebidos:');
      console.log(`   - Total de spreads: ${Object.keys(data.spreads?.data || {}).length}`);
      console.log(`   - Posições abertas: ${data.positions?.open?.length || 0}`);
      console.log(`   - Posições fechadas: ${data.positions?.closed?.length || 0}`);
      
      // Verificar símbolos específicos
      const symbolsToCheck = ['RBNT_USDT', 'GROK_USDT', 'WHITE_USDT', 'LUCE_USDT', 'VR_USDT'];
      
      console.log('\n🔍 Verificando Símbolos Específicos:');
      symbolsToCheck.forEach(symbol => {
        const spreadData = data.spreads?.data?.[symbol];
        if (spreadData) {
          console.log(`   ✅ ${symbol}: ${spreadData.spMax.toFixed(4)}% (${spreadData.crosses} registros)`);
        } else {
          console.log(`   ❌ ${symbol}: NÃO ENCONTRADO`);
        }
      });
      
      // Mostrar alguns exemplos
      console.log('\n📋 Exemplos de Dados:');
      const sampleSymbols = Object.keys(data.spreads?.data || {}).slice(0, 5);
      sampleSymbols.forEach(symbol => {
        const spreadData = data.spreads.data[symbol];
        console.log(`   ${symbol}: ${spreadData.spMax.toFixed(4)}% (${spreadData.crosses} registros)`);
      });
      
    } else {
      console.log('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Detalhes:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testApiPerformance(); 