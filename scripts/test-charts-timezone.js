const fetch = require('node-fetch');

async function testChartsTimezone() {
  console.log('🕐 Testando horários dos gráficos...');
  
  const baseUrl = 'https://robo-de-arbitragem-5n8k.onrender.com';
  const symbol = 'SNS_USDT';
  
  const endpoints = [
    `/api/spread-history/24h/${encodeURIComponent(symbol)}`,
    `/api/price-comparison/${encodeURIComponent(symbol)}`
  ];
  
  console.log(`\n📊 Testando com símbolo: ${symbol}`);
  console.log(`🌍 Fuso horário esperado: America/Sao_Paulo`);
  console.log(`📅 Data atual: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  for (const endpoint of endpoints) {
    try {
      const chartType = endpoint.includes('spread-history') ? 'Spread 24h' : 'Spot vs Futures';
      console.log(`\n📡 Testando: ${chartType}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`);
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
          
          const [firstDate, firstTime] = firstTimestamp.split(' - ');
          const [firstDay, firstMonth] = firstDate.split('/').map(Number);
          const [firstHour, firstMinute] = firstTime.split(':').map(Number);
          
          const firstDateObj = new Date(2025, firstMonth - 1, firstDay, firstHour, firstMinute);
          const isInRange = firstDateObj >= yesterday && firstDateObj <= now;
          
          console.log(`   Período correto: ${isInRange ? '✅ Sim' : '❌ Não'}`);
          console.log(`   Data primeiro item: ${firstDateObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
          console.log(`   Período esperado: ${yesterday.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} até ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        }
      } else {
        console.log(`⚠️ Nenhum dado encontrado`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao testar ${endpoint}:`, error.message);
    }
  }
  
  console.log('\n🎯 RESULTADO:');
  console.log('Se as datas e horários estiverem corretos, você deve ver:');
  console.log('• Formato: DD/MM - HH:mm (ex: 15/07 - 01:00)');
  console.log('• Período: Últimas 24 horas');
  console.log('• Fuso horário: America/Sao_Paulo');
}

testChartsTimezone().catch(console.error); 