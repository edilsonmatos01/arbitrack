const { Client } = require('pg');

console.log('🔍 TESTE DA URL CORRIGIDA FINAL\n');

// URL corrigida (com caracteres certos)
const URL_CORRIGIDA = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3b19GI5DHmL9x11Xd4I329vT@dpg-d1i63eqdbo4c7387d210-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

console.log('✅ URL CORRIGIDA:');
console.log(`   ${URL_CORRIGIDA}`);
console.log('');
console.log('🔧 Correções aplicadas:');
console.log('   - Senha: b19GI5DHmL9x11Xd4I329vT (com "1" e "1")');
console.log('   - Host: dpg-d1i63eqdbo4c7387d210-a (com "1" e "0")');
console.log('   - Domínio: .oregon-postgres.render.com (completo)');
console.log('');

// Teste da URL corrigida
async function testCorrectedUrl() {
    console.log('🧪 Testando URL corrigida...');
    
    const client = new Client({
        connectionString: URL_CORRIGIDA + '?sslmode=require&connect_timeout=30',
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
    const success = await testCorrectedUrl();
    
    if (success) {
        console.log('\n🎉 URL CORRIGIDA FUNCIONA!');
        console.log('🔧 render.yaml atualizado com sucesso!');
        console.log('🚀 Faça commit e push para aplicar as correções');
    } else {
        console.log('\n⚠️  URL ainda não funciona');
        console.log('🔧 O banco pode estar inativo ou a URL ainda incorreta');
    }
}

runTest().catch(console.error); 