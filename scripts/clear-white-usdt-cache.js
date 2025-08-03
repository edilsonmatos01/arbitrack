const fetch = require('node-fetch');

async function clearWhiteUSDTCache() {
  console.log('🧹 LIMPANDO CACHE ESPECÍFICO - WHITE_USDT');
  console.log('==========================================\n');
  
  const baseUrl = 'http://localhost:3000';
  const symbol = 'WHITE_USDT';
  
  try {
    console.log(`📊 Limpando cache para: ${symbol}`);
    
    // Teste 1: Limpar cache forçando refresh
    console.log('\n📡 Testando com refresh forçado...');
    const refreshResponse = await fetch(`${baseUrl}/api/spread-history/24h/${encodeURIComponent(symbol)}?refresh=true&nocache=true`);
    const refreshData = await refreshResponse.json();
    
    console.log(`📊 Status: ${refreshResponse.status}`);
    console.log(`📈 Quantidade de dados: ${Array.isArray(refreshData) ? refreshData.length : 'N/A'}`);
    
    if (Array.isArray(refreshData) && refreshData.length > 0) {
      console.log(`🕐 Primeiro registro: ${refreshData[0].timestamp}`);
      console.log(`🕐 Último registro: ${refreshData[refreshData.length - 1].timestamp}`);
      
      // Verificar se agora está atualizado
      const lastTimestamp = refreshData[refreshData.length - 1].timestamp;
      const [date, time] = lastTimestamp.split(' - ');
      const [hour, minute] = time.split(':').map(Number);
      
      const now = new Date();
      const currentHour = now.getHours();
      const hourDiff = Math.abs(currentHour - hour);
      
      console.log(`⏰ Diferença de horas após limpeza: ${hourDiff}h`);
      
      if (hourDiff <= 1) {
        console.log(`✅ CACHE LIMPO COM SUCESSO! Agora está atualizado.`);
      } else {
        console.log(`⚠️  Cache limpo mas ainda há diferença de ${hourDiff}h`);
      }
    }
    
    // Teste 2: Verificar dados brutos novamente
    console.log('\n📡 Verificando dados brutos após limpeza...');
    const rawResponse = await fetch(`${baseUrl}/api/spread-history?symbol=${encodeURIComponent(symbol)}&nocache=true`);
    const rawData = await rawResponse.json();
    
    if (Array.isArray(rawData) && rawData.length > 0) {
      console.log(`📊 Dados brutos: ${rawData.length} registros`);
      console.log(`🕐 Último registro bruto: ${rawData[rawData.length - 1].timestamp}`);
    }
    
    // Teste 3: Comparar novamente com BRISE_USDT
    console.log('\n📡 Comparando novamente com BRISE_USDT...');
    const briseResponse = await fetch(`${baseUrl}/api/spread-history/24h/BRISE_USDT?nocache=true`);
    const briseData = await briseResponse.json();
    
    if (Array.isArray(refreshData) && refreshData.length > 0 && Array.isArray(briseData) && briseData.length > 0) {
      const whiteLast = refreshData[refreshData.length - 1].timestamp;
      const briseLast = briseData[briseData.length - 1].timestamp;
      
      console.log(`📊 Comparação após limpeza:`);
      console.log(`  WHITE_USDT: ${whiteLast}`);
      console.log(`  BRISE_USDT: ${briseLast}`);
      
      const whiteHour = parseInt(whiteLast.split(' - ')[1].split(':')[0]);
      const briseHour = parseInt(briseLast.split(' - ')[1].split(':')[0]);
      
      const hourDiff = Math.abs(whiteHour - briseHour);
      console.log(`⏰ Diferença entre WHITE e BRISE: ${hourDiff}h`);
      
      if (hourDiff <= 1) {
        console.log(`✅ PROBLEMA RESOLVIDO! Timezones agora estão consistentes.`);
      } else {
        console.log(`🚨 PROBLEMA PERSISTE: Diferença de ${hourDiff}h entre WHITE e BRISE`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  }
}

clearWhiteUSDTCache(); 