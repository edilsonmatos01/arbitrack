// Script para testar a conversão de dados entre worker e interface

// Dados que o worker envia (formato ArbitrageOpportunity)
const workerData = {
  type: 'arbitrage',
  baseSymbol: 'WHITE',
  profitPercentage: 5.7136,
  buyAt: {
    exchange: 'gateio',
    price: 0.0003973,
    marketType: 'spot'
  },
  sellAt: {
    exchange: 'mexc',
    price: 0.00042,
    marketType: 'futures'
  },
  arbitrageType: 'spot_to_futures',
  timestamp: Date.now()
};

console.log('🧪 Teste de Conversão de Dados');
console.log('=' .repeat(50));

console.log('📤 Dados do Worker:');
console.log(JSON.stringify(workerData, null, 2));

// Simular a conversão que a interface faz
const convertedData = {
  symbol: workerData.baseSymbol,
  compraExchange: workerData.buyAt.exchange,
  compraPreco: workerData.buyAt.price,
  vendaExchange: workerData.sellAt.exchange,
  vendaPreco: workerData.sellAt.price,
  spread: ((workerData.sellAt.price - workerData.buyAt.price) / workerData.buyAt.price) * 100,
  tipo: 'inter',
  directionApi: workerData.arbitrageType && workerData.arbitrageType.includes('spot_to_futures') ? 'SPOT_TO_FUTURES' : 'FUTURES_TO_SPOT',
  maxSpread24h: null,
  buyAtMarketType: workerData.buyAt.marketType,
  sellAtMarketType: workerData.sellAt.marketType,
};

console.log('\n📥 Dados Convertidos para Interface:');
console.log(JSON.stringify(convertedData, null, 2));

// Simular o cálculo de spread na interface
const spotPrice = convertedData.compraPreco;
const futuresPrice = convertedData.vendaPreco;
const spreadValue = ((futuresPrice - spotPrice) / spotPrice) * 100;

console.log('\n🧮 Cálculo de Spread na Interface:');
console.log(`Spot Price: ${spotPrice}`);
console.log(`Futures Price: ${futuresPrice}`);
console.log(`Spread Calculado: ${spreadValue.toFixed(4)}%`);
console.log(`Spread Original: ${workerData.profitPercentage.toFixed(4)}%`);
console.log(`Diferença: ${Math.abs(spreadValue - workerData.profitPercentage).toFixed(4)}%`);

// Verificar se os spreads são iguais
if (Math.abs(spreadValue - workerData.profitPercentage) < 0.0001) {
  console.log('\n✅ SUCESSO: Spreads são iguais!');
} else {
  console.log('\n❌ ERRO: Spreads são diferentes!');
}

// Testar com dados reais dos logs
console.log('\n🔍 Teste com Dados Reais dos Logs:');
const realData = {
  symbol: 'BOOP_USDT',
  compraExchange: 'gateio',
  compraPreco: 0.02574,
  vendaExchange: 'mexc',
  vendaPreco: 0.0258
};

const realSpread = ((realData.vendaPreco - realData.compraPreco) / realData.compraPreco) * 100;
console.log(`Dados Reais: ${JSON.stringify(realData)}`);
console.log(`Spread Calculado: ${realSpread.toFixed(4)}%`);
console.log(`Spread nos Logs: -0.386%`);
console.log(`Problema: Spread deveria ser positivo, mas está negativo!`);

// Análise do problema
console.log('\n🔧 ANÁLISE DO PROBLEMA:');
console.log('1. Worker envia: buyAt.price = spot, sellAt.price = futures');
console.log('2. Interface converte: compraPreco = buyAt.price, vendaPreco = sellAt.price');
console.log('3. Interface calcula: spread = (vendaPreco - compraPreco) / compraPreco');
console.log('4. Mas os logs mostram spreads negativos!');

console.log('\n💡 POSSÍVEIS CAUSAS:');
console.log('1. Dados sendo sobrescritos em algum lugar');
console.log('2. Problema na função getLivePrice');
console.log('3. Dados chegando em formato diferente');
console.log('4. Cache de preços antigos');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('1. Verificar se os dados chegam corretamente no WebSocket');
console.log('2. Verificar se há cache de preços antigos');
console.log('3. Verificar se a função getLivePrice está funcionando');
console.log('4. Adicionar logs detalhados na conversão'); 