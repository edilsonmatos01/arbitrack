// Script para testar a nova API com correções de timezone
const { toZonedTime, format } = require('date-fns-tz');

console.log('=== TESTE DA NOVA API COM CORREÇÕES ===');

// Simular as funções da nova API
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
      const manualConversion = new Date(date.getTime() - (3 * 60 * 60 * 1000));
      return manualConversion;
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

// Teste 1: Verificar conversão básica
function testBasicConversion() {
  console.log('\n=== TESTE 1: CONVERSÃO BÁSICA ===');
  
  const now = new Date();
  console.log('Hora atual (UTC):', now.toISOString());
  
  const converted = forceSaoPauloConversion(now);
  console.log('Convertida para São Paulo:', formatDateTimeForSaoPaulo(converted));
  
  const expected = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  console.log('Esperado (UTC-3):', formatDateTimeForSaoPaulo(expected));
}

// Teste 2: Verificar conversão de horário específico (11:14)
function testSpecificTime() {
  console.log('\n=== TESTE 2: HORÁRIO ESPECÍFICO (11:14) ===');
  
  const testTime = new Date();
  testTime.setHours(11, 14, 0, 0);
  console.log('Horário de teste (UTC):', testTime.toISOString());
  
  const converted = forceSaoPauloConversion(testTime);
  console.log('Convertida para São Paulo:', formatDateTimeForSaoPaulo(converted));
  
  // Verificar se está correto (deve ser 11:14 em São Paulo)
  const expectedHour = 11;
  const expectedMinute = 14;
  const actualHour = converted.getHours();
  const actualMinute = converted.getMinutes();
  
  console.log(`Esperado: ${expectedHour}:${expectedMinute.toString().padStart(2, '0')}`);
  console.log(`Atual: ${actualHour}:${actualMinute.toString().padStart(2, '0')}`);
  
  if (actualHour === expectedHour && actualMinute === expectedMinute) {
    console.log('✅ CONVERSÃO CORRETA!');
  } else {
    console.log('❌ CONVERSÃO INCORRETA!');
  }
}

// Teste 3: Verificar criação de intervalos
function testIntervals() {
  console.log('\n=== TESTE 3: CRIAÇÃO DE INTERVALOS ===');
  
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const nowInSaoPaulo = forceSaoPauloConversion(now);
  const startInSaoPaulo = forceSaoPauloConversion(start);
  
  console.log('Intervalo em São Paulo:');
  console.log('- Início:', formatDateTimeForSaoPaulo(startInSaoPaulo));
  console.log('- Fim:', formatDateTimeForSaoPaulo(nowInSaoPaulo));
  
  // Criar alguns intervalos
  let currentTime = roundToNearestInterval(startInSaoPaulo, 30);
  const endTime = roundToNearestInterval(nowInSaoPaulo, 30);
  
  console.log('\nPrimeiros 5 intervalos:');
  let count = 0;
  while (currentTime <= endTime && count < 5) {
    const timeKey = formatDateTimeForSaoPaulo(currentTime);
    console.log(`- ${timeKey}`);
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    count++;
  }
}

// Teste 4: Verificar dados mock do banco
function testMockData() {
  console.log('\n=== TESTE 4: DADOS MOCK DO BANCO ===');
  
  // Simular dados do banco (timestamps em UTC)
  const mockData = [
    { timestamp: new Date('2025-07-15T14:00:00.000Z'), spread: 2.5 },
    { timestamp: new Date('2025-07-15T14:30:00.000Z'), spread: 3.1 },
    { timestamp: new Date('2025-07-15T15:00:00.000Z'), spread: 2.8 },
    { timestamp: new Date('2025-07-15T15:30:00.000Z'), spread: 3.5 },
  ];
  
  console.log('Dados mock (UTC):');
  mockData.forEach((record, index) => {
    console.log(`${index + 1}. ${record.timestamp.toISOString()} -> ${record.spread}%`);
  });
  
  console.log('\nProcessamento como na nova API:');
  const groupedData = new Map();
  
  for (const record of mockData) {
    const recordInSaoPaulo = forceSaoPauloConversion(record.timestamp);
    const roundedTime = roundToNearestInterval(recordInSaoPaulo, 30);
    const timeKey = formatDateTimeForSaoPaulo(roundedTime);
    
    const currentMax = groupedData.get(timeKey) || 0;
    groupedData.set(timeKey, Math.max(currentMax, record.spread));
  }
  
  console.log('Resultado final:');
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
}

// Executar todos os testes
testBasicConversion();
testSpecificTime();
testIntervals();
testMockData();

console.log('\n=== FIM DOS TESTES ==='); 