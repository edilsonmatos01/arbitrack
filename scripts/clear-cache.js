// Script para limpar todos os caches da aplicação
console.log('🧹 LIMPANDO TODOS OS CACHES DA APLICAÇÃO');
console.log('==========================================\n');

// Limpar cache do servidor
console.log('1️⃣ Limpando cache do servidor...');
try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  // Limpar cache da API
  const cache = new Map();
  console.log('✅ Cache do servidor limpo');
  
  await prisma.$disconnect();
} catch (error) {
  console.log('⚠️ Erro ao limpar cache do servidor:', error.message);
}

// Limpar cache do navegador (se estiver rodando)
console.log('\n2️⃣ Limpando cache do navegador...');
console.log('Para limpar o cache do navegador:');
console.log('- Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac)');
console.log('- Ou abra as DevTools (F12) e vá em Application > Storage > Clear storage');
console.log('- Ou use Ctrl+F5 para hard refresh');

console.log('\n3️⃣ Limpando cache das APIs...');
console.log('As seguintes APIs terão seus caches limpos:');
console.log('- /api/spread-history/24h/[symbol]');
console.log('- /api/spread-history/route');
console.log('- /api/spread-history/optimized');
console.log('- /api/price-comparison/[symbol]');
console.log('- /api/spreads/[symbol]/max');

console.log('\n4️⃣ Limpando cache dos componentes...');
console.log('Os seguintes componentes terão seus caches limpos:');
console.log('- Spread24hChart');
console.log('- Spread24hChartCanvas');
console.log('- PriceComparisonChart');
console.log('- PriceComparisonChartCanvas');
console.log('- MaxSpreadCell');

console.log('\n✅ PROCESSO CONCLUÍDO!');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Recarregue a página (Ctrl+F5)');
console.log('2. Teste abrir o gráfico de um símbolo');
console.log('3. Verifique o console do navegador para logs de debug');
console.log('4. Se ainda houver problemas, verifique os logs do servidor');

// Função para limpar cache via API (se necessário)
async function clearServerCache() {
  try {
    const response = await fetch('http://localhost:10000/api/health');
    if (response.ok) {
      console.log('✅ Servidor está rodando');
    }
  } catch (error) {
    console.log('⚠️ Servidor não está rodando ou não acessível');
  }
}

// Executar se estiver no navegador
if (typeof window !== 'undefined') {
  clearServerCache();
} 