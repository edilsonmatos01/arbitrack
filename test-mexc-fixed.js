// TESTE DA VERSÃO CORRIGIDA MEXC FUTURES
// Este arquivo testa a versão corrigida do conector MEXC

const { MexcFuturesConnector } = require('./src/mexc-futures-connector-fixed.js');

console.log('🔍 TESTE DA VERSÃO CORRIGIDA MEXC FUTURES');
console.log('=' * 50);

// Função para processar atualizações de preço
function handlePriceUpdate(update) {
    const { identifier, symbol, bestAsk, bestBid } = update;
    console.log(`💰 [${identifier}] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
}

// Função para quando conectar
function onConnect() {
    console.log('✅ MEXC conectado com sucesso!');
}

// Criar instância do conector
const mexcConnector = new MexcFuturesConnector('mexc', handlePriceUpdate, onConnect);

// Função principal de teste
async function testMexcFixed() {
    try {
        console.log('\n🚀 Iniciando teste da versão corrigida MEXC...');
        
        // 1. Testar API REST
        console.log('\n📡 Teste 1: API REST');
        const pairs = await mexcConnector.getTradablePairs();
        console.log(`✅ API REST: ${pairs.length} pares encontrados`);
        
        if (pairs.length > 0) {
            console.log('📊 Primeiros 5 pares:', pairs.slice(0, 5));
        }
        
        // 2. Conectar WebSocket
        console.log('\n🔌 Teste 2: WebSocket');
        await mexcConnector.connect();
        
        // 3. Aguardar conexão e inscrever em alguns pares
        setTimeout(async () => {
            if (mexcConnector.isConnected) {
                console.log('\n📊 Teste 3: Subscrição');
                
                // Usar apenas alguns pares para teste
                const testPairs = pairs.slice(0, 5);
                console.log(`📤 Inscrevendo em ${testPairs.length} pares de teste:`, testPairs);
                
                mexcConnector.subscribe(testPairs);
                
                // Aguardar dados por 30 segundos
                setTimeout(() => {
                    console.log('\n⏱️ Teste concluído. Desconectando...');
                    mexcConnector.disconnect();
                    process.exit(0);
                }, 30000);
                
            } else {
                console.log('❌ WebSocket não conectou');
                process.exit(1);
            }
        }, 5000);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        process.exit(1);
    }
}

// Handlers de shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Recebido sinal de parada...');
    mexcConnector.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido sinal de término...');
    mexcConnector.disconnect();
    process.exit(0);
});

// Executar teste
testMexcFixed().catch((error) => {
    console.error('❌ Erro fatal no teste:', error);
    process.exit(1);
}); 