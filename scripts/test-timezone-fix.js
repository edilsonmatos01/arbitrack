const fetch = require('node-fetch');

async function testTimezoneFix() {
  console.log('🕐 Testando correção de timezone...\n');
  
  const baseUrl = 'http://localhost:3000';
  const symbol = 'WHITE_USDT';
  
  try {
    console.log(`📊 Testando símbolo: ${symbol}`);
    console.log(`🌍 Horário atual (Brasil): ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`🌍 Horário atual (UTC): ${new Date().toISOString()}`);
    
    // Testar API de spread history 24h
    console.log('\n📡 Testando API Spread History 24h...');
    const response = await fetch(`${baseUrl}/api/spread-history/24h/${encodeURIComponent(symbol)}`);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📈 Quantidade de dados: ${Array.isArray(data) ? data.length : 'N/A'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`🕐 Primeiro registro: ${data[0].timestamp}`);
      console.log(`🕐 Último registro: ${data[data.length - 1].timestamp}`);
      
      // Verificar se o último registro está próximo do horário atual
      const lastTimestamp = data[data.length - 1].timestamp;
      const now = new Date();
      const nowInBrazil = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      console.log(`\n✅ Verificação:`);
      console.log(`   Horário atual (Brasil): ${nowInBrazil}`);
      console.log(`   Último registro: ${lastTimestamp}`);
      
      // Extrair hora do último registro
      const timePart = lastTimestamp.split(' - ')[1];
      const [hour, minute] = timePart.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const hourDiff = Math.abs(currentHour - hour);
      const minuteDiff = Math.abs(currentMinute - minute);
      
      console.log(`   Diferença de horas: ${hourDiff}h ${minuteDiff}min`);
      
      if (hourDiff <= 1) {
        console.log(`   ✅ Timezone corrigido! Último registro está próximo do horário atual.`);
      } else {
        console.log(`   ⚠️  Possível problema de timezone. Diferença muito grande.`);
      }
    } else {
      console.log('❌ Nenhum dado encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testTimezoneFix(); 