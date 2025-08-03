// Script para testar o timezone no ambiente do Render
const { toZonedTime, format } = require('date-fns-tz');

console.log('=== TESTE DE TIMEZONE NO RENDER ===');

// Simular configurações do Render
process.env.TZ = 'America/Sao_Paulo';
process.env.NODE_ENV = 'production';

console.log('Configurações:');
console.log('- TZ:', process.env.TZ);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Timezone do sistema:', Intl.DateTimeFormat().resolvedOptions().timeZone);

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

// Simular dados do banco (timestamps em UTC)
const mockDatabaseData = [
  { timestamp: new Date('2025-07-15T14:00:00.000Z'), spread: 2.5 },
  { timestamp: new Date('2025-07-15T14:30:00.000Z'), spread: 3.1 },
  { timestamp: new Date('2025-07-15T15:00:00.000Z'), spread: 2.8 },
  { timestamp: new Date('2025-07-15T15:30:00.000Z'), spread: 3.5 },
  { timestamp: new Date('2025-07-15T16:00:00.000Z'), spread: 2.9 },
  { timestamp: new Date('2025-07-15T17:00:00.000Z'), spread: 3.2 },
  { timestamp: new Date('2025-07-15T18:00:00.000Z'), spread: 2.7 },
];

console.log('\n=== DADOS MOCK DO BANCO ===');
mockDatabaseData.forEach((record, index) => {
  console.log(`Registro ${index + 1}: ${record.timestamp.toISOString()} -> ${record.spread}%`);
});

// Teste 1: Processamento como na API Spread 24h
function testSpread24hProcessing() {
  console.log('\n=== TESTE PROCESSAMENTO SPREAD 24H ===');
  
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('Intervalo de busca:');
  console.log('- Início (UTC):', start.toISOString());
  console.log('- Fim (UTC):', now.toISOString());
  
  // Filtrar dados do banco
  const filteredData = mockDatabaseData.filter(record => 
    record.timestamp >= start && record.timestamp <= now
  );
  
  console.log(`Dados filtrados: ${filteredData.length} registros`);
  
  // Criar intervalos no fuso de São Paulo
  const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
  const startInSaoPaulo = toZonedTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'America/Sao_Paulo');
  
  console.log('Intervalos em São Paulo:');
  console.log('- Início:', formatDateTime(startInSaoPaulo));
  console.log('- Fim:', formatDateTime(nowInSaoPaulo));
  
  // Criar buckets de tempo
  const groupedData = new Map();
  let currentTime = roundToNearestInterval(startInSaoPaulo, 30);
  const endTime = roundToNearestInterval(nowInSaoPaulo, 30);
  
  while (currentTime <= endTime) {
    const timeKey = formatDateTime(currentTime);
    groupedData.set(timeKey, 0);
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  }
  
  console.log(`Buckets criados: ${groupedData.size}`);
  
  // Processar dados
  for (const record of filteredData) {
    const recordInSaoPaulo = toZonedTime(record.timestamp, 'America/Sao_Paulo');
    const roundedTime = roundToNearestInterval(recordInSaoPaulo, 30);
    const timeKey = formatDateTime(roundedTime);
    
    const currentMax = groupedData.get(timeKey) || 0;
    groupedData.set(timeKey, Math.max(currentMax, record.spread));
  }
  
  console.log('\nResultado final:');
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

// Teste 2: Verificar se há problema na conversão de timezone
function testTimezoneConversion() {
  console.log('\n=== TESTE DE CONVERSÃO DE TIMEZONE ===');
  
  // Testar com horário específico (11:14 - horário atual do usuário)
  const testTime = new Date();
  testTime.setHours(11, 14, 0, 0); // 11:14
  
  console.log('Testando conversão para 11:14:');
  console.log('- Hora original:', testTime.toISOString());
  
  const converted = toZonedTime(testTime, 'America/Sao_Paulo');
  console.log('- Convertida para São Paulo:', formatDateTime(converted));
  
  // Verificar se está 3 horas atrás
  const expectedTime = new Date(testTime.getTime() - 3 * 60 * 60 * 1000);
  console.log('- Esperado (3h atrás):', formatDateTime(expectedTime));
  
  const diff = Math.abs(converted.getTime() - expectedTime.getTime());
  console.log(`- Diferença: ${diff}ms`);
  
  if (diff < 1000) {
    console.log('⚠️  PROBLEMA IDENTIFICADO: Conversão está 3 horas atrás!');
  } else {
    console.log('✅ Conversão parece correta');
  }
}

// Teste 3: Verificar se há problema na criação dos intervalos
function testIntervalCreation() {
  console.log('\n=== TESTE DE CRIAÇÃO DE INTERVALOS ===');
  
  const now = new Date();
  console.log('Hora atual:', now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  // Testar diferentes formas de criar intervalos
  console.log('\nMétodo 1: Usando toZonedTime');
  const nowInSaoPaulo1 = toZonedTime(now, 'America/Sao_Paulo');
  const interval1 = roundToNearestInterval(nowInSaoPaulo1, 30);
  console.log('- Resultado:', formatDateTime(interval1));
  
  console.log('\nMétodo 2: Usando toLocaleString');
  const nowInSaoPaulo2 = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const interval2 = roundToNearestInterval(nowInSaoPaulo2, 30);
  console.log('- Resultado:', formatDateTime(interval2));
  
  console.log('\nMétodo 3: Usando getTimezoneOffset');
  const offset = now.getTimezoneOffset();
  const nowInSaoPaulo3 = new Date(now.getTime() - (offset * 60 * 1000));
  const interval3 = roundToNearestInterval(nowInSaoPaulo3, 30);
  console.log('- Resultado:', formatDateTime(interval3));
  
  // Verificar diferenças
  const diff1 = Math.abs(interval1.getTime() - interval2.getTime());
  const diff2 = Math.abs(interval1.getTime() - interval3.getTime());
  
  console.log(`\nDiferenças:`);
  console.log(`- Método 1 vs 2: ${diff1}ms`);
  console.log(`- Método 1 vs 3: ${diff2}ms`);
}

// Executar testes
const result = testSpread24hProcessing();
testTimezoneConversion();
testIntervalCreation();

console.log('\n=== FIM DOS TESTES ==='); 