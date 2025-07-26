const { Client } = require('pg');

console.log('🔍 TESTE DA URL FINAL CORRIGIDA\n');

// URL que você forneceu (ainda incorreta)
const URL_FORNECIDA = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3bl9GI5DHmL9x1lXd4I329vT@dpg-d1i63eqdbo4c7387d2l0-a/arbitragem_banco_bdx8';

// URL CORRETA (com todos os caracteres certos)
const URL_CORRETA = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3b19GI5DHmL9x11Xd4I329vT@dpg-d1i63eqdbo4c7387d210-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

console.log('📋 COMPARAÇÃO DAS URLs:');
console.log('');
console.log('❌ URL FORNECIDA (incorreta):');
console.log(`   ${URL_FORNECIDA}`);
console.log('   Problemas:');
console.log('   - "l" minúsculo na senha: bl9GI5DHmL9x1lXd4I329vT');
console.log('   - "l" minúsculo no host: dpg-d1i63eqdbo4c7387d2l0-a');
console.log('   - Falta domínio: .oregon-postgres.render.com');
console.log('');
console.log('✅ URL CORRETA:');
console.log(`   ${URL_CORRETA}`);
console.log('   Correções:');
console.log('   - Senha correta: b19GI5DHmL9x11Xd4I329vT');
console.log('   - Host correto: dpg-d1i63eqdbo4c7387d210-a');
console.log('   - Domínio completo: .oregon-postgres.render.com');
console.log('');

// Teste da URL correta
async function testCorrectUrl() {
    console.log('🧪 Testando URL correta...');
    
    const client = new Client({
        connectionString: URL_CORRETA + '?sslmode=require&connect_timeout=30',
    });

    try {
        await client.connect();
        console.log('✅ Conexão estabelecida com sucesso!');
        
        const result = await client.query('SELECT NOW() as current_time');
        console.log(`📅 Hora do servidor: ${result.rows[0].current_time}`);
        
        await client.end();
        return true;
    } catch (error) {
        console.log('❌ Erro na conexão:');
        console.log(`   ${error.message}`);
        return false;
    }
}

// Executar teste
async function runTest() {
    const success = await testCorrectUrl();
    
    if (success) {
        console.log('\n🎉 URL CORRETA FUNCIONA!');
        console.log('🔧 Use esta URL no serviço arbitragem-frontend:');
        console.log(`   ${URL_CORRETA}`);
    } else {
        console.log('\n⚠️  URL ainda não funciona');
        console.log('🔧 Verifique se o banco arbitragem-banco-pago está ativo');
    }
}

runTest().catch(console.error); 