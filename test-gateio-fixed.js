// TESTE DA GATE.IO SPOT
// Este arquivo testa especificamente a Gate.io

const { GateioConnector } = require('./src/gateio-connector.js');

console.log('🔍 TESTE DA GATE.IO SPOT');
console.log('=' * 50);

// Função para processar atualizações de preço
function handlePriceUpdate(update) {
    const { identifier, symbol, bestAsk, bestBid } = update;
    console.log(`💰 [${identifier}] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
}

// Função para quando conectar
function onConnect() {
    console.log('✅ Gate.io conectado com sucesso!');
}

// Criar instância do conector
const gateioConnector = new GateioConnector();

// Configurar callback de preços
gateioConnector.onPriceUpdate(handlePriceUpdate);

// Função principal de teste
async function testGateio() {
    try {
        console.log('\n🚀 Iniciando teste da Gate.io...');
        
        // 1. Testar obtenção de símbolos
        console.log('\n📡 Teste 1: Obter símbolos');
        const symbols = await gateioConnector.getSpotSymbols();
        console.log(`✅ Gate.io: ${symbols.length} símbolos obtidos`);
        
        if (symbols.length > 0) {
            console.log('📊 Primeiros 10 símbolos:', symbols.slice(0, 10));
        }
        
        // 2. Conectar WebSocket
        console.log('\n🔌 Teste 2: WebSocket');
        await gateioConnector.connect();
        
        // 3. Aguardar dados por 30 segundos
        setTimeout(() => {
            console.log('\n⏱️ Teste concluído. Desconectando...');
            gateioConnector.disconnect();
            process.exit(0);
        }, 30000);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        process.exit(1);
    }
}

// Handlers de shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Recebido sinal de parada...');
    gateioConnector.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido sinal de término...');
    gateioConnector.disconnect();
    process.exit(0);
});

// Executar teste
testGateio().catch((error) => {
    console.error('❌ Erro fatal no teste:', error);
    process.exit(1);
}); 