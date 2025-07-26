// TESTE ESPECÍFICO DA API REST MEXC
// Este arquivo testa especificamente a API REST da MEXC

const fetch = require('node-fetch');

console.log('🔍 TESTE ESPECÍFICO DA API REST MEXC');
console.log('=' * 50);

async function testMexcApi() {
    const REST_URL = 'https://contract.mexc.com/api/v1/contract/detail';
    
    try {
        console.log('\n📡 Testando API REST MEXC...');
        console.log('URL:', REST_URL);
        
        const response = await fetch(REST_URL);
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('\n📊 Resposta completa:');
        console.log(JSON.stringify(data, null, 2));
        
        // Analisar estrutura da resposta
        if (data && typeof data === 'object') {
            console.log('\n🔍 Análise da estrutura:');
            console.log('Tipo de data:', typeof data);
            console.log('Chaves:', Object.keys(data));
            
            if (data.success !== undefined) {
                console.log('Success:', data.success);
            }
            
            if (data.code !== undefined) {
                console.log('Code:', data.code);
            }
            
            if (data.data !== undefined) {
                console.log('Tipo de data.data:', typeof data.data);
                if (Array.isArray(data.data)) {
                    console.log('data.data é um array com', data.data.length, 'elementos');
                    if (data.data.length > 0) {
                        console.log('Primeiro elemento:', JSON.stringify(data.data[0], null, 2));
                    }
                } else {
                    console.log('data.data não é um array:', typeof data.data);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao testar API:', error);
    }
}

// Executar teste
testMexcApi().then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
}); 