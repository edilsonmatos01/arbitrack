// Script para debugar a diferença entre as APIs
const { toZonedTime, format } = require('date-fns-tz');

console.log('=== DEBUG: DIFERENÇA ENTRE APIs ===');

// Simular dados do banco
const mockSpreadHistory = [
  { timestamp: new Date('2025-07-15T14:00:00.000Z'), spread: 2.5, spotPrice: 100, futuresPrice: 102.5 },
  { timestamp: new Date('2025-07-15T14:30:00.000Z'), spread: 3.1, spotPrice: 101, futuresPrice: 104.1 },
  { timestamp: new Date('2025-07-15T15:00:00.000Z'), spread: 2.8, spotPrice: 102, futuresPrice: 104.8 },
  { timestamp: new Date('2025-07-15T15:30:00.000Z'), spread: 3.5, spotPrice: 103, futuresPrice: 106.5 },
];

function formatDateTime(date) {
  const saoPauloTime = toZonedTime(date, 'America/Sao_Paulo');
  return format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
}

function roundToNearestInterval(date, intervalMinutes) {
  const minutes = Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
  const rounded = new Date(date);
  rounded.setMinutes(minutes, 0, 0);
  return rounded;
}

// Simular API Spread 24h (que está com problema)
function simulateSpread24hAPI() {
  console.log('\n=== SIMULAÇÃO API SPREAD 24H ===');
  
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
  
  // Processar como na API Spread 24h
  const groupedData = new Map();
  
  // Criar datas no fuso de São Paulo
  const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
  const startInSaoPaulo = toZonedTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'America/Sao_Paulo');
  
  console.log('Intervalos em São Paulo:');
  console.log('- Início:', formatDateTime(startInSaoPaulo));
  console.log('- Fim:', formatDateTime(nowInSaoPaulo));
  
  // Criar intervalos
  let currentTime = roundToNearestInterval(startInSaoPaulo, 30);
  const endTime = roundToNearestInterval(nowInSaoPaulo, 30);
  
  while (currentTime <= endTime) {
    const timeKey = formatDateTime(currentTime);
    if (!groupedData.has(timeKey)) {
      groupedData.set(timeKey, 0);
    }
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  }
  
  // Processar dados
  for (const record of filteredData) {
    const recordInSaoPaulo = toZonedTime(record.timestamp, 'America/Sao_Paulo');
    const roundedTime = roundToNearestInterval(recordInSaoPaulo, 30);
    const timeKey = formatDateTime(roundedTime);
    
    const currentMax = groupedData.get(timeKey) || 0;
    groupedData.set(timeKey, Math.max(currentMax, record.spread));
  }
  
  console.log('\nResultado Spread 24h:');
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
  
  return result;
}

// Simular API Price Comparison (que funciona)
function simulatePriceComparisonAPI() {
  console.log('\n=== SIMULAÇÃO API PRICE COMPARISON ===');
  
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('Intervalo de busca:');
  console.log('- Início (UTC):', start.toISOString());
  console.log('- Fim (UTC):', now.toISOString());
  
  // Filtrar dados (com filtro adicional para preços válidos)
  const filteredData = mockSpreadHistory.filter(record => 
    record.timestamp >= start && 
    record.timestamp <= now &&
    record.spotPrice > 0 &&
    record.futuresPrice > 0
  );
  
  console.log(`Dados filtrados: ${filteredData.length} registros`);
  
  // Processar como na API Price Comparison
  const groupedData = new Map();
  
  // Criar datas no fuso de São Paulo
  const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
  const startInSaoPaulo = toZonedTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'America/Sao_Paulo');
  
  console.log('Intervalos em São Paulo:');
  console.log('- Início:', formatDateTime(startInSaoPaulo));
  console.log('- Fim:', formatDateTime(nowInSaoPaulo));
  
  // Criar intervalos
  let currentTime = roundToNearestInterval(startInSaoPaulo, 30);
  const endTime = roundToNearestInterval(nowInSaoPaulo, 30);
  
  while (currentTime <= endTime) {
    const timeKey = formatDateTime(currentTime);
    if (!groupedData.has(timeKey)) {
      groupedData.set(timeKey, {
        spot: { sum: 0, count: 0 },
        futures: { sum: 0, count: 0 }
      });
    }
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  }
  
  // Processar dados
  for (const record of filteredData) {
    const recordInSaoPaulo = toZonedTime(record.timestamp, 'America/Sao_Paulo');
    const roundedTime = roundToNearestInterval(recordInSaoPaulo, 30);
    const timeKey = formatDateTime(roundedTime);
    
    const group = groupedData.get(timeKey);
    if (group) {
      group.spot.sum += record.spotPrice;
      group.spot.count += 1;
      group.futures.sum += record.futuresPrice;
      group.futures.count += 1;
    }
  }
  
  console.log('\nResultado Price Comparison:');
  const result = Array.from(groupedData.entries())
    .map(([timestamp, data]) => ({
      timestamp,
      gateio_price: data.spot.count > 0 ? data.spot.sum / data.spot.count : 0,
      mexc_price: data.futures.count > 0 ? data.futures.sum / data.futures.count : 0
    }))
    .filter(item => item.gateio_price > 0 && item.mexc_price > 0)
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
    console.log(`- ${item.timestamp}: Gate.io=${item.gateio_price}, MEXC=${item.mexc_price}`);
  });
  
  return result;
}

// Comparar resultados
function compareResults() {
  console.log('\n=== COMPARAÇÃO DE RESULTADOS ===');
  
  const spread24hResult = simulateSpread24hAPI();
  const priceComparisonResult = simulatePriceComparisonAPI();
  
  console.log('\nDiferenças encontradas:');
  
  // Verificar se os timestamps são iguais
  const spread24hTimestamps = spread24hResult.map(item => item.timestamp);
  const priceComparisonTimestamps = priceComparisonResult.map(item => item.timestamp);
  
  console.log('Timestamps Spread 24h:', spread24hTimestamps);
  console.log('Timestamps Price Comparison:', priceComparisonTimestamps);
  
  // Verificar se há diferença nos horários
  const differentTimestamps = spread24hTimestamps.filter(ts => !priceComparisonTimestamps.includes(ts));
  console.log('Timestamps diferentes:', differentTimestamps);
  
  if (differentTimestamps.length > 0) {
    console.log('❌ PROBLEMA IDENTIFICADO: Timestamps diferentes entre as APIs!');
  } else {
    console.log('✅ Timestamps iguais entre as APIs');
  }
}

// Executar debug
compareResults();

console.log('\n=== FIM DO DEBUG ==='); 