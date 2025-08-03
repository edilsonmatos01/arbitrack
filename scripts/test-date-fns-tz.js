const { toZonedTime, format } = require('date-fns-tz');

console.log('=== TESTE DATE-FNS-TZ ===');

// Testar com data atual
const now = new Date();
console.log('Data atual (UTC):', now.toISOString());
console.log('Data atual (local):', now.toString());

// Testar conversão para São Paulo
const saoPauloTime = toZonedTime(now, 'America/Sao_Paulo');
console.log('Data em São Paulo:', saoPauloTime.toString());

// Testar formatação
const formatted = format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
console.log('Formatado:', formatted);

// Testar com data específica (problema relatado)
const testDate = new Date('2025-07-15T01:25:00.000Z');
console.log('\nTeste com data específica:');
console.log('Data UTC:', testDate.toISOString());
const testSaoPaulo = toZonedTime(testDate, 'America/Sao_Paulo');
console.log('Data em São Paulo:', testSaoPaulo.toString());
const testFormatted = format(testSaoPaulo, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
console.log('Formatado:', testFormatted);

// Testar com data que está aparecendo errada (14/07 - 22:30)
const wrongDate = new Date('2025-07-14T22:30:00.000Z');
console.log('\nTeste com data que está aparecendo errada:');
console.log('Data UTC:', wrongDate.toISOString());
const wrongSaoPaulo = toZonedTime(wrongDate, 'America/Sao_Paulo');
console.log('Data em São Paulo:', wrongSaoPaulo.toString());
const wrongFormatted = format(wrongSaoPaulo, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
console.log('Formatado:', wrongFormatted);

console.log('\n=== FIM DO TESTE ==='); 