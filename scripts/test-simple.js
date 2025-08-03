const fetch = require('node-fetch');

async function testSimple() {
  try {
    console.log('🕐 Testando API de Spread History...\n');
    
    const response = await fetch('http://localhost:3000/api/spread-history/24h?symbol=WHITE_USDT');
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📈 Total de registros: ${data.length}`);
    
    if (data.length > 0) {
      console.log(`🕐 Primeiro registro: ${data[0].timestamp}`);
      console.log(`🕐 Último registro: ${data[data.length - 1].timestamp}`);
      
      // Mostrar os últimos 5 registros
      console.log('\n📋 Últimos 5 registros:');
      const last5 = data.slice(-5);
      last5.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.timestamp}: ${item.spread_percentage}%`);
      });
      
      // Verificar horário atual
      const now = new Date();
      const nowInBrazil = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      console.log(`\n🌍 Horário atual (Brasil): ${nowInBrazil}`);
      
      // Extrair hora do último registro
      const lastTimestamp = data[data.length - 1].timestamp;
      const timePart = lastTimestamp.split(' - ')[1];
      console.log(`🕐 Último registro: ${lastTimestamp}`);
      
      // Verificar se está próximo do horário atual
      const [hour, minute] = timePart.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const hourDiff = Math.abs(currentHour - hour);
      console.log(`⏰ Diferença de horas: ${hourDiff}h`);
      
      if (hourDiff <= 1) {
        console.log(`✅ Timezone corrigido! Último registro está próximo do horário atual.`);
      } else {
        console.log(`⚠️  Possível problema de timezone. Diferença: ${hourDiff}h`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSimple(); 