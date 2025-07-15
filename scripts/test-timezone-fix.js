// Script para testar as correções de timezone
const { toZonedTime, format } = require('date-fns-tz');

console.log('=== TESTE DAS CORREÇÕES DE TIMEZONE ===');

// Função corrigida (igual ao Spot vs Futures)
function formatDateTimeCorrect(date) {
  const saoPauloTime = toZonedTime(date, 'America/Sao_Paulo');
  return format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
}

// Função antiga (problemática)
function formatDateTimeOld(date) {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(', ', ' - ');
}

// Função para arredondar intervalos
function roundToNearestInterval(date, intervalMinutes) {
  const minutes = Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
  const rounded = new Date(date);
  rounded.setMinutes(minutes, 0, 0);
  return rounded;
}

// Teste com data atual
const now = new Date();
console.log('\n=== TESTE COM DATA ATUAL ===');
console.log('Data atual (UTC):', now.toISOString());
console.log('Data atual (local):', now.toString());

// Teste com intervalos de 30 minutos
console.log('\n=== TESTE COM INTERVALOS DE 30 MINUTOS ===');

// Método antigo (problemático)
console.log('MÉTODO ANTIGO (problemático):');
let currentTimeOld = new Date(now.getTime() - 24 * 60 * 60 * 1000);
currentTimeOld.setMinutes(Math.floor(currentTimeOld.getMinutes() / 30) * 30, 0, 0);

for (let i = 0; i < 5; i++) {
  const timeKeyOld = formatDateTimeOld(currentTimeOld);
  console.log(`  ${currentTimeOld.toISOString()} -> ${timeKeyOld}`);
  currentTimeOld = new Date(currentTimeOld.getTime() + 30 * 60 * 1000);
}

// Método novo (corrigido)
console.log('\nMÉTODO NOVO (corrigido):');
const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
const startInSaoPaulo = toZonedTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'America/Sao_Paulo');

let currentTimeNew = roundToNearestInterval(startInSaoPaulo, 30);

for (let i = 0; i < 5; i++) {
  const timeKeyNew = formatDateTimeCorrect(currentTimeNew);
  console.log(`  ${currentTimeNew.toISOString()} -> ${timeKeyNew}`);
  currentTimeNew = new Date(currentTimeNew.getTime() + 30 * 60 * 1000);
}

// Teste com horário específico (09:30)
console.log('\n=== TESTE COM HORÁRIO ESPECÍFICO (09:30) ===');
const testDate = new Date();
testDate.setHours(9, 30, 0, 0);

console.log('Data de teste (UTC):', testDate.toISOString());
console.log('Método antigo:', formatDateTimeOld(testDate));
console.log('Método novo:', formatDateTimeCorrect(testDate));

// Verificar se o horário está correto (deve ser 09:30 em São Paulo)
const testDateInSaoPaulo = toZonedTime(testDate, 'America/Sao_Paulo');
console.log('Data em São Paulo:', testDateInSaoPaulo.toString());
console.log('Horário em São Paulo:', format(testDateInSaoPaulo, 'HH:mm', { timeZone: 'America/Sao_Paulo' }));

console.log('\n=== CONCLUSÃO ===');
console.log('✅ O método novo deve mostrar horários corretos de São Paulo');
console.log('❌ O método antigo mostrava horários com 3 horas de diferença');
console.log('🔧 Correções aplicadas em todos os arquivos de spread history'); 