require('dotenv').config();

console.log('🔍 Testando variáveis de ambiente...');
console.log('');

console.log('📊 DATABASE_URL:');
console.log(process.env.DATABASE_URL ? '✅ Definida' : '❌ Não definida');
if (process.env.DATABASE_URL) {
  console.log('   URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
}

console.log('');
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || '❌ Não definida');

console.log('');
console.log('🔑 Variáveis de API (não necessárias):');
console.log('   GATEIO_API_KEY:', process.env.GATEIO_API_KEY ? '✅ Definida' : '❌ Não definida');
console.log('   MEXC_API_KEY:', process.env.MEXC_API_KEY ? '✅ Definida' : '❌ Não definida');

console.log('');
console.log('📡 URLs de WebSocket (para dados públicos):');
console.log('   Gate.io WS:', 'wss://api.gateio.ws/ws/v4/');
console.log('   MEXC WS:', 'wss://wbs.mexc.com/ws');

console.log('');
console.log('✅ Teste concluído!'); 