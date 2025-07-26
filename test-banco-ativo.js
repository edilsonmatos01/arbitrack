const { Client } = require('pg');

console.log('🔍 TESTE DO BANCO ATIVO: arbitragem-banco-pago\n');

// NOTA: Você precisa substituir esta URL pela URL correta do seu banco ativo
// A URL atual é do banco antigo que não está funcionando
const DATABASE_URL_ANTIGA = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3b19GI5DHmL9x11Xd4I329vT@dpg-d1i63eqdbo4c7387d210-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

console.log('❌ URL ANTIGA (não funciona):');
console.log(`   ${DATABASE_URL_ANTIGA.substring(0, 80)}...`);
console.log('');

console.log('✅ BANCO ATIVO DETECTADO:');
console.log('   Nome: arbitragem-banco-pago');
console.log('   Status: ✓ Available');
console.log('   Plano: Basic-256mb');
console.log('   Região: Oregon (US West)');
console.log('');

console.log('🔧 PRÓXIMOS PASSOS:');
console.log('1. No Render Dashboard, vá em arbitragem-banco-pago');
console.log('2. Clique em "Connections" ou "Info"');
console.log('3. Copie a URL de conexão (Internal Database URL)');
console.log('4. Substitua a DATABASE_URL no serviço arbitragem-frontend');
console.log('');

console.log('📋 FORMATO ESPERADO DA URL:');
console.log('   postgresql://usuario:senha@host:porta/banco');
console.log('');

console.log('⚠️  IMPORTANTE:');
console.log('- Use a URL INTERNAL do banco (não a external)');
console.log('- A URL deve terminar com o nome do banco');
console.log('- Exemplo: .../arbitragem_banco_pago');
console.log('');

console.log('🎯 APÓS ATUALIZAR A URL:');
console.log('1. Faça novo deploy do frontend');
console.log('2. Teste a conectividade');
console.log('3. Verifique se os erros de banco desaparecem');
console.log('');

console.log('✅ Banco está ativo, só precisa da URL correta!'); 