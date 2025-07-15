const fetch = require('node-fetch');

async function compareAPIs() {
  console.log('🔍 COMPARANDO APIS - SPREAD 24H vs SPOT VS FUTURES');
  
  const baseUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  const symbol = 'WHITE_USDT';
  
  const apis = [
    {
      name: 'Spread 24h',
      url: `/api/spread-history/24h/${encodeURIComponent(symbol)}`
    },
    {
      name: 'Spot vs Futures',
      url: `/api/price-comparison/${encodeURIComponent(symbol)}`
    }
  ];
  
  console.log(`\n📊 Testando com símbolo: ${symbol}`);
  console.log(`🌍 Fuso horário esperado: America/Sao_Paulo`);
  console.log(`📅 Data atual: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  for (const api of apis) {
    try {
      console.log(`\n📡 Testando: ${api.name}`);
      console.log(`🔗 URL: ${api.url}`);
      
      const response = await fetch(`${baseUrl}${api.url}`);
      const data = await response.json();
      
      console.log(`📊 Status: ${response.status}`);
      console.log(`📈 Quantidade de dados: ${Array.isArray(data) ? data.length : 'N/A'}`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`📋 Primeiro item:`, JSON.stringify(data[0], null, 2));
        console.log(`📋 Último item:`, JSON.stringify(data[data.length - 1], null, 2));
        
        // Verificar se as datas estão corretas
        const firstTimestamp = data[0].timestamp;
        const lastTimestamp = data[data.length - 1].timestamp;
        
        if (firstTimestamp) {
          console.log(`🔍 Análise de fuso horário:`);
          console.log(`   Primeiro timestamp: ${firstTimestamp}`);
          console.log(`   Último timestamp: ${lastTimestamp}`);
          
          // Verificar se as datas estão no formato correto (DD/MM - HH:mm)
          const timestampRegex = /^\d{2}\/\d{2} - \d{2}:\d{2}$/;
          const isFirstValid = timestampRegex.test(firstTimestamp);
          const isLastValid = timestampRegex.test(lastTimestamp);
          
          console.log(`   Formato primeiro: ${isFirstValid ? '✅ Correto' : '❌ Incorreto'}`);
          console.log(`   Formato último: ${isLastValid ? '✅ Correto' : '❌ Incorreto'}`);
          
          // Verificar se as datas estão no período correto (últimas 24h)
          const now = new Date();
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          
          const [lastDate, lastTime] = lastTimestamp.split(' - ');
          const [lastDay, lastMonth] = lastDate.split('/').map(Number);
          const [lastHour, lastMinute] = lastTime.split(':').map(Number);
          
          const lastDateObj = new Date(2025, lastMonth - 1, lastDay, lastHour, lastMinute);
          const isInRange = lastDateObj >= yesterday && lastDateObj <= now;
          
          console.log(`   Período correto: ${isInRange ? '✅ Sim' : '❌ Não'}`);
          console.log(`   Data último item: ${lastDateObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
          console.log(`   Período esperado: ${yesterday.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} até ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
          
          // Verificar se está no horário correto (deve ser próximo a 01:30)
          const expectedHour = 1; // 01:xx
          const expectedDay = 15; // 15/07
          const isCorrectTime = lastDay === expectedDay && lastHour === expectedHour;
          console.log(`   Horário correto (15/07 - 01:xx): ${isCorrectTime ? '✅ Sim' : '❌ Não'}`);
        }
      } else {
        console.log(`⚠️ Nenhum dado encontrado`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao testar ${api.name}:`, error.message);
    }
  }
  
  console.log('\n🎯 RESULTADO:');
  console.log('Se as datas e horários estiverem corretos, você deve ver:');
  console.log('• Formato: DD/MM - HH:mm (ex: 15/07 - 01:30)');
  console.log('• Período: Últimas 24 horas');
  console.log('• Fuso horário: America/Sao_Paulo');
  console.log('• Horário atual: próximo a 01:30 do dia 15/07');
}

compareAPIs().catch(console.error); 