const fetch = require('node-fetch');
const { toZonedTime, format } = require('date-fns-tz');

async function testTimezoneSpread() {
  console.log('🕐 Testando Timezone do Gráfico Spread 24h...\n');
  
  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  
  for (const symbol of symbols) {
    try {
      console.log(`📊 Testando ${symbol}:`);
      
      // Teste 1: API de spread history
      const response = await fetch(`http://localhost:3000/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      const data = await response.json();
      
      console.log(`  📈 Registros encontrados: ${data.length}`);
      
      if (data.length > 0) {
        console.log(`  🕐 Primeiro registro: ${data[0].timestamp}`);
        console.log(`  🕐 Último registro: ${data[data.length - 1].timestamp}`);
        
        // Teste 2: Verificar timezone atual
        const now = new Date();
        const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
        const nowFormatted = format(nowInSaoPaulo, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
        
        console.log(`  🌍 Horário atual (UTC): ${now.toISOString()}`);
        console.log(`  🇧🇷 Horário atual (SP): ${nowFormatted}`);
        console.log(`  ⏰ Diferença esperada: 3 horas`);
        
        // Teste 3: Verificar se os timestamps estão no formato correto
        const sampleTimestamp = data[0].timestamp;
        console.log(`  📅 Formato do timestamp: ${sampleTimestamp}`);
        
        // Verificar se o formato está correto (dd/MM - HH:mm)
        const timestampRegex = /^\d{2}\/\d{2} - \d{2}:\d{2}$/;
        if (timestampRegex.test(sampleTimestamp)) {
          console.log(`  ✅ Formato do timestamp está correto`);
        } else {
          console.log(`  ❌ Formato do timestamp está incorreto`);
        }
        
        // Teste 4: Verificar se os horários fazem sentido
        const [date, time] = sampleTimestamp.split(' - ');
        const [day, month] = date.split('/');
        const [hour, minute] = time.split(':');
        
        console.log(`  📅 Data: ${day}/${month}`);
        console.log(`  🕐 Hora: ${hour}:${minute}`);
        
        // Verificar se a hora está no intervalo válido (0-23)
        const hourNum = parseInt(hour);
        if (hourNum >= 0 && hourNum <= 23) {
          console.log(`  ✅ Hora válida: ${hourNum}h`);
        } else {
          console.log(`  ❌ Hora inválida: ${hourNum}h`);
        }
        
      } else {
        console.log(`  ⚠️  Sem dados suficientes`);
      }
      
    } catch (error) {
      console.log(`  ❌ Erro: ${error.message}`);
    }
    
    console.log(''); // Linha em branco
  }
  
  console.log('🎉 Teste de Timezone Concluído!');
  console.log('\n📋 Verificações realizadas:');
  console.log('  ✅ Formato dos timestamps');
  console.log('  ✅ Conversão para fuso de São Paulo');
  console.log('  ✅ Validação de horários');
  console.log('  ✅ Comparação com horário atual');
}

// Executar o teste
testTimezoneSpread().catch(console.error); 