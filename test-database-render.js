const { Client } = require('pg');

console.log('🔍 TESTE DE CONECTIVIDADE COM BANCO DE DADOS\n');

// URL do banco no render.yaml
const DATABASE_URL = 'postgresql://arbitragem_banco_bdx8_user:eSa4DBin3b19GI5DHmL9x11Xd4I329vT@dpg-d1i63eqdbo4c7387d210-a.oregon-postgres.render.com/arbitragem_banco_bdx8';

console.log('📋 Configuração do banco:');
console.log(`   Host: dpg-d1i63eqdbo4c7387d210-a.oregon-postgres.render.com`);
console.log(`   Port: 5432`);
console.log(`   Database: arbitragem_banco_bdx8`);
console.log(`   User: arbitragem_banco_bdx8_user`);
console.log('');

// Teste 1: Conexão básica
async function testBasicConnection() {
    console.log('1️⃣ Testando conexão básica...');
    
    const client = new Client({
        connectionString: DATABASE_URL + '?sslmode=require&connect_timeout=30',
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

// Teste 2: Verificar tabelas
async function checkTables() {
    console.log('\n2️⃣ Verificando tabelas...');
    
    const client = new Client({
        connectionString: DATABASE_URL + '?sslmode=require&connect_timeout=30',
    });

    try {
        await client.connect();
        
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Tabelas encontradas:');
            result.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        } else {
            console.log('⚠️  Nenhuma tabela encontrada');
        }
        
        await client.end();
        return true;
    } catch (error) {
        console.log('❌ Erro ao verificar tabelas:');
        console.log(`   ${error.message}`);
        return false;
    }
}

// Teste 3: Verificar se o banco está ativo
async function checkDatabaseStatus() {
    console.log('\n3️⃣ Verificando status do banco...');
    
    const client = new Client({
        connectionString: DATABASE_URL + '?sslmode=require&connect_timeout=30',
    });

    try {
        await client.connect();
        
        const result = await client.query(`
            SELECT 
                version() as version,
                current_database() as database,
                current_user as user,
                inet_server_addr() as server_addr,
                inet_server_port() as server_port
        `);
        
        console.log('✅ Informações do banco:');
        console.log(`   Versão: ${result.rows[0].version.split(' ')[0]}`);
        console.log(`   Database: ${result.rows[0].database}`);
        console.log(`   User: ${result.rows[0].user}`);
        console.log(`   Server: ${result.rows[0].server_addr}:${result.rows[0].server_port}`);
        
        await client.end();
        return true;
    } catch (error) {
        console.log('❌ Erro ao verificar status:');
        console.log(`   ${error.message}`);
        return false;
    }
}

// Executar testes
async function runTests() {
    console.log('🚀 Iniciando testes de conectividade...\n');
    
    const test1 = await testBasicConnection();
    const test2 = await checkTables();
    const test3 = await checkDatabaseStatus();
    
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log(`   Conexão básica: ${test1 ? '✅' : '❌'}`);
    console.log(`   Verificação de tabelas: ${test2 ? '✅' : '❌'}`);
    console.log(`   Status do banco: ${test3 ? '✅' : '❌'}`);
    
    if (test1 && test2 && test3) {
        console.log('\n🎉 BANCO DE DADOS FUNCIONANDO PERFEITAMENTE!');
        console.log('💡 O problema pode estar na aplicação, não no banco.');
    } else {
        console.log('\n⚠️  PROBLEMAS DETECTADOS NO BANCO DE DADOS');
        console.log('🔧 Verifique se o banco está ativo no Render Dashboard');
    }
}

runTests().catch(console.error); 