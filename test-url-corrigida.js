const { Client } = require('pg');

console.log('🔍 TESTE DA URL CORRIGIDA DO BANCO\n');

// URL que você forneceu (com caracteres incorretos)
const URL_FORNECIDA = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

// URL do render.yaml (correta)
const URL_RENDER_YAML = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3b19GI5DHmL9x11Xd4I329vT@dpg-d1i63eqdbo4c7387d210-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

console.log('📋 COMPARAÇÃO DAS URLs:');
console.log('');
console.log('❌ URL FORNECIDA (incorreta):');
console.log(`   ${URL_FORNECIDA.substring(0, 80)}...`);
console.log('   Problemas: "l" minúsculo na senha e host');
console.log('');
console.log('✅ URL DO RENDER.YAML (correta):');
console.log(`   ${URL_RENDER_YAML.substring(0, 80)}...`);
console.log('   Caracteres corretos: "1" e "0"');
console.log('');

console.log('🔧 PRÓXIMOS PASSOS:');
console.log('1. No Render Dashboard, vá em arbitragem-banco-pago');
console.log('2. Clique em "Connections" ou "Info"');
console.log('3. Copie a URL INTERNAL exata');
console.log('4. Compare com as URLs acima');
console.log('5. Use a URL correta no serviço arbitragem-frontend');
console.log('');

console.log('⚠️  IMPORTANTE:');
console.log('- A URL deve ser EXATA, sem caracteres incorretos');
console.log('- Use a URL INTERNAL do banco ativo');
console.log('- Verifique se termina com o nome correto do banco');
console.log('');

console.log('🎯 TESTE RÁPIDO:');
console.log('Execute: node test-database-render.js');
console.log('Para testar a URL do render.yaml');
console.log('');

console.log('✅ Corrija a URL e teste novamente!'); 