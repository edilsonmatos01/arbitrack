// Script para testar a diferença entre as APIs de timezone
const { toZonedTime, format } = require('date-fns-tz');

console.log('=== TESTE DE DIFERENÇA ENTRE APIs ===');

// Simular o ambiente do Render
process.env.TZ = 'America/Sao_Paulo';

function formatDateTime(date) {
  // Converter para fuso horário de São Paulo usando date-fns-tz
  const saoPauloTime = toZonedTime(date, 'America/Sao_Paulo');
  return format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
}

function roundToNearestInterval(date, intervalMinutes) {
  const minutes = Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
  const rounded = new Date(date);
  rounded.setMinutes(minutes, 0, 0);
  return rounded;
}

// Teste 1: Simular API Spread 24h (que está com problema)
function testSpread24hAPI() {
  console.log('\n=== TESTE API SPREAD 24H ===');
  
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('Agora (UTC):', now.toISOString());
  console.log('Início (UTC):', start.toISOString());
  
  // Criar datas no fuso horário de São Paulo
  const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
  const startInSaoPaulo = toZonedTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'America/Sao_Paulo');
  
  console.log('Agora em São Paulo:', formatDateTime(nowInSaoPaulo));
  console.log('Início em São Paulo:', formatDateTime(startInSaoPaulo));
  
  // Criar intervalos
  let currentTime = roundToNearestInterval(startInSaoPaulo, 30);
  const endTime = roundToNearestInterval(nowInSaoPaulo, 30);
  
  console.log('\nIntervalos criados:');
  let count = 0;
  while (currentTime <= endTime && count < 5) {
    const timeKey = formatDateTime(currentTime);
    console.log(`Intervalo ${count + 1}: ${timeKey} (${currentTime.toISOString()})`);
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    count++;
  }
}

// Teste 2: Simular API Price Comparison (que funciona)
function testPriceComparisonAPI() {
  console.log('\n=== TESTE API PRICE COMPARISON ===');
  
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('Agora (UTC):', now.toISOString());
  console.log('Início (UTC):', start.toISOString());
  
  // Criar datas no fuso horário de São Paulo
  const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
  const startInSaoPaulo = toZonedTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'America/Sao_Paulo');
  
  console.log('Agora em São Paulo:', formatDateTime(nowInSaoPaulo));
  console.log('Início em São Paulo:', formatDateTime(startInSaoPaulo));
  
  // Criar intervalos
  let currentTime = roundToNearestInterval(startInSaoPaulo, 30);
  const endTime = roundToNearestInterval(nowInSaoPaulo, 30);
  
  console.log('\nIntervalos criados:');
  let count = 0;
  while (currentTime <= endTime && count < 5) {
    const timeKey = formatDateTime(currentTime);
    console.log(`Intervalo ${count + 1}: ${timeKey} (${currentTime.toISOString()})`);
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    count++;
  }
}

// Teste 3: Verificar se há diferença na criação dos intervalos
function testIntervalCreation() {
  console.log('\n=== TESTE DE CRIAÇÃO DE INTERVALOS ===');
  
  const now = new Date();
  console.log('Hora atual:', now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  // Testar diferentes formas de criar o intervalo de 24h
  console.log('\nMétodo 1: Criar em UTC e converter');
  const start1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const start1InSaoPaulo = toZonedTime(start1, 'America/Sao_Paulo');
  console.log('Início (UTC):', start1.toISOString());
  console.log('Início (São Paulo):', formatDateTime(start1InSaoPaulo));
  
  console.log('\nMétodo 2: Criar diretamente em São Paulo');
  const nowInSaoPaulo = toZonedTime(now, 'America/Sao_Paulo');
  const start2InSaoPaulo = new Date(nowInSaoPaulo.getTime() - 24 * 60 * 60 * 1000);
  console.log('Início (São Paulo direto):', formatDateTime(start2InSaoPaulo));
  
  // Verificar se há diferença
  const diff = Math.abs(start1InSaoPaulo.getTime() - start2InSaoPaulo.getTime());
  console.log(`Diferença entre métodos: ${diff}ms`);
  
  if (diff > 1000) {
    console.log('⚠️  DIFERENÇA DETECTADA! Os métodos produzem resultados diferentes.');
  } else {
    console.log('✅ Métodos produzem resultados similares.');
  }
}

// Executar testes
testSpread24hAPI();
testPriceComparisonAPI();
testIntervalCreation();

console.log('\n=== FIM DOS TESTES ==='); 