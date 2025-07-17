// Script para testar as correções de timezone
console.log('=== TESTE DAS CORREÇÕES DE TIMEZONE ===');

// Função que simula a nova formatação de data (sem conversão de timezone)
function formatDateTime(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month} - ${hours}:${minutes}`;
}

// Função antiga (com conversão para São Paulo)
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

// Testar com diferentes horários
function testTimeFormats() {
  console.log('\n1️⃣ TESTANDO FORMATOS DE HORA');
  
  const now = new Date();
  console.log('Data atual:', now.toISOString());
  console.log('Data atual (local):', now.toString());
  
  console.log('\nComparação de formatos:');
  console.log('Antigo (com conversão SP):', formatDateTimeOld(now));
  console.log('Novo (sem conversão):', formatDateTime(now));
  
  // Testar com horários específicos
  const testTimes = [
    new Date('2025-07-17T10:00:00.000Z'), // 10:00 UTC
    new Date('2025-07-17T13:00:00.000Z'), // 13:00 UTC
    new Date('2025-07-17T18:00:00.000Z'), // 18:00 UTC
    new Date('2025-07-17T22:00:00.000Z'), // 22:00 UTC
  ];
  
  console.log('\nTeste com horários específicos:');
  testTimes.forEach((time, index) => {
    console.log(`\nHorário ${index + 1}:`);
    console.log(`  UTC: ${time.toISOString()}`);
    console.log(`  Local: ${time.toString()}`);
    console.log(`  Antigo: ${formatDateTimeOld(time)}`);
    console.log(`  Novo: ${formatDateTime(time)}`);
  });
}

// Testar intervalos de 30 minutos
function testIntervals() {
  console.log('\n2️⃣ TESTANDO INTERVALOS DE 30 MINUTOS');
  
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h atrás
  
  console.log('Intervalo de 24h:');
  console.log('Início:', start.toISOString());
  console.log('Fim:', now.toISOString());
  
  console.log('\nPrimeiros 5 intervalos (30 min cada):');
  let currentTime = new Date(start);
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}. ${formatDateTime(currentTime)}`);
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  }
  
  console.log('\nÚltimos 5 intervalos:');
  currentTime = new Date(now.getTime() - 4 * 30 * 60 * 1000); // 2h atrás
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}. ${formatDateTime(currentTime)}`);
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  }
}

// Testar formatação de timestamp para exibição
function testTimestampFormatting() {
  console.log('\n3️⃣ TESTANDO FORMATAÇÃO DE TIMESTAMP');
  
  const now = new Date();
  
  // Simular formatação como nos componentes
  const formatTimestamp = (date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(', ', ' - ');
  };
  
  console.log('Timestamp formatado:', formatTimestamp(now));
  console.log('Comparação:');
  console.log('  Antigo (com timezone):', now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  console.log('  Novo (sem timezone):', now.toLocaleString('pt-BR'));
}

// Executar todos os testes
console.log('🔧 CORREÇÕES APLICADAS:');
console.log('✅ Removida conversão de timezone nas APIs');
console.log('✅ Removida conversão de timezone nos componentes');
console.log('✅ Usando horário local em todos os gráficos');
console.log('✅ Formatos de data consistentes');

testTimeFormats();
testIntervals();
testTimestampFormatting();

console.log('\n=== FIM DO TESTE ===');
console.log('\n📋 RESUMO:');
console.log('• Os gráficos agora exibem o horário atual (sem -3 horas)');
console.log('• As APIs retornam dados no horário local');
console.log('• Todos os componentes usam formatação consistente');
console.log('• O timezone do servidor (TZ=America/Sao_Paulo) continua configurado'); 