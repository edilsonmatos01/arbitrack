// Script para testar o fuso horário
console.log('=== TESTE DE FUSO HORÁRIO ===');

// Verificar variável de ambiente TZ
console.log('TZ Environment Variable:', process.env.TZ || 'Não definida');

// Testar formatação de data
function formatDateTime(date) {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(', ', ' - ');
}

// Testar conversão de fuso horário
function testTimezoneConversion() {
  const now = new Date();
  console.log('\n=== TESTE DE CONVERSÃO ===');
  console.log('Data atual (UTC):', now.toISOString());
  console.log('Data atual (local):', now.toString());
  
  // Testar conversão para São Paulo
  const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  console.log('Data em São Paulo:', saoPauloTime.toString());
  
  // Testar formatação
  const formatted = formatDateTime(now);
  console.log('Formatado (pt-BR):', formatted);
  
  // Testar com data específica
  const testDate = new Date('2024-07-14T21:00:00.000Z');
  console.log('\nTeste com data específica:');
  console.log('Data UTC:', testDate.toISOString());
  console.log('Formatado:', formatDateTime(testDate));
}

// Testar intervalos
function testIntervals() {
  console.log('\n=== TESTE DE INTERVALOS ===');
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('Agora (UTC):', now.toISOString());
  console.log('Início 24h (UTC):', start.toISOString());
  
  // Converter para São Paulo
  const nowInSaoPaulo = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const startInSaoPaulo = new Date(nowInSaoPaulo.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('Agora (São Paulo):', nowInSaoPaulo.toString());
  console.log('Início 24h (São Paulo):', startInSaoPaulo.toString());
  
  // Testar alguns intervalos
  let currentTime = new Date(startInSaoPaulo);
  for (let i = 0; i < 5; i++) {
    console.log(`Intervalo ${i}:`, formatDateTime(currentTime));
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  }
}

// Executar testes
testTimezoneConversion();
testIntervals();

console.log('\n=== FIM DO TESTE ==='); 