// Script para testar a API corrigida
const { toZonedTime, format } = require('date-fns-tz');

console.log('=== TESTE DA API CORRIGIDA ===');

// Simular dados do banco
const mockSpreadHistory = [
  { timestamp: new Date('2025-07-15T14:00:00.000Z'), spread: 2.5 },
  { timestamp: new Date('2025-07-15T14:30:00.000Z'), spread: 3.1 },
  { timestamp: new Date('2025-07-15T15:00:00.000Z'), spread: 2.8 },
  { timestamp: new Date('2025-07-15T15:30:00.000Z'), spread: 3.5 },
];

function formatDateTimeForSaoPaulo(date) {
  const saoPauloTime = toZonedTime(date, 'America/Sao_Paulo');
  return format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
}

function forceSaoPauloConversion(date) {
  try {
    const converted = toZonedTime(date, 'America/Sao_Paulo');
    
    const originalHour = date.getUTCHours();
    const convertedHour = converted.getHours();
    
    if (Math.abs(originalHour - convertedHour) === 3) {
      console.log('[WARNING] Possível problema de timezone detectado, usando fallback');
      return new Date(date.getTime() - (3 * 60 * 60 * 1000));
    }
    
    return converted;
  } catch (error) {
    console.log('[WARNING] Erro na conversão automática, usando fallback manual');
    return new Date(date.getTime() - (3 * 60 * 60 * 1000));
  }
}

function roundToNearestInterval(date, intervalMinutes) {
  const minutes = Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
  const rounded = new Date(date);
  rounded.setMinutes(minutes, 0, 0);
  return rounded;
}

// Simular a API corrigida
function simulateFixedAPI() {
  console.log('\n=== SIMULAÇÃO API CORRIGIDA ===');
  
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('Intervalo de busca:');
  console.log('- Início (UTC):', start.toISOString());
  console.log('- Fim (UTC):', now.toISOString());
  
  // Filtrar dados
  const filteredData = mockSpreadHistory.filter(record => 
    record.timestamp >= start && record.timestamp <= now
  );
  
  console.log(`Dados filtrados: ${filteredData.length} registros`);
  
  // Processar como na API corrigida
  const groupedData = new Map();
  
  // CORREÇÃO: Não criar intervalos vazios - apenas processar dados existentes
  const batchSize = 1000;
  for (let i = 0; i < filteredData.length; i += batchSize) {
    const batch = filteredData.slice(i, i + batchSize);
    
    for (const record of batch) {
      // Converter timestamp do banco (UTC) para São Paulo com fallback
      const recordInSaoPaulo = forceSaoPauloConversion(record.timestamp);
      const roundedTime = roundToNearestInterval(recordInSaoPaulo, 30);
      const timeKey = formatDateTimeForSaoPaulo(roundedTime);
      
      // Criar intervalo apenas se não existir
      if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, 0);
      }
      
      const currentMax = groupedData.get(timeKey) || 0;
      groupedData.set(timeKey, Math.max(currentMax, record.spread));
    }
  }
  
  console.log('\nResultado da API corrigida:');
  const result = Array.from(groupedData.entries())
    .map(([timestamp, spread]) => ({ timestamp, spread_percentage: spread }))
    .sort((a, b) => {
      const [dateA, timeA] = a.timestamp.split(' - ');
      const [dateB, timeB] = b.timestamp.split(' - ');
      const [dayA, monthA] = dateA.split('/').map(Number);
      const [dayB, monthB] = dateB.split('/').map(Number);
      const [hourA, minuteA] = timeA.split(':').map(Number);
      const [hourB, minuteB] = timeB.split(':').map(Number);
      if (monthA !== monthB) return monthA - monthB;
      if (dayA !== dayB) return dayA - dayB;
      if (hourA !== hourB) return hourA - hourB;
      return minuteA - minuteB;
    });
  
  result.forEach(item => {
    console.log(`- ${item.timestamp}: ${item.spread_percentage}%`);
  });
  
  console.log(`\nTotal de intervalos criados: ${result.length}`);
  
  return result;
}

// Executar teste
const result = simulateFixedAPI();

console.log('\n=== FIM DO TESTE ==='); 