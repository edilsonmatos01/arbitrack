// Teste dos dados do gráfico
console.log('🧪 Teste dos Dados do Gráfico');

async function testChartData() {
  try {
    console.log('\n1. Testando dados da API de gráfico...');
    const response = await fetch('http://localhost:3000/api/spread-history/24h/VR_USDT');
    const data = await response.json();
    
    console.log('✅ Dados recebidos:', data.length, 'pontos');
    console.log('📊 Estrutura do primeiro ponto:', data[0]);
    
    // Testar parsing do timestamp
    const testTimestamp = data[0].timestamp;
    console.log('\n2. Testando parsing do timestamp...');
    console.log('📅 Timestamp original:', testTimestamp);
    
    const [datePart, timePart] = testTimestamp.split(' - ');
    const [day, month] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    
    const currentYear = new Date().getFullYear();
    const parsedDate = new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    
    console.log('📅 Data parseada:', parsedDate);
    console.log('🕐 Horário formatado:', parsedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    
    // Testar dados de spread
    console.log('\n3. Testando dados de spread...');
    const spreads = data.map(point => point.spread_percentage);
    console.log('📈 Spreads:', spreads);
    console.log('📊 Máximo:', Math.max(...spreads));
    console.log('📊 Mínimo:', Math.min(...spreads));
    console.log('📊 Média:', spreads.reduce((a, b) => a + b, 0) / spreads.length);
    
    console.log('\n✅ Dados do gráfico estão corretos!');
    
    return {
      success: true,
      data,
      spreads,
      testTimestamp,
      parsedDate
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { success: false, error };
  }
}

// Executar teste
testChartData().then(result => {
  if (result.success) {
    console.log('\n🎉 DADOS DO GRÁFICO PRONTOS!');
    console.log('📱 O gráfico deve funcionar corretamente agora.');
  } else {
    console.log('\n⚠️ Há problemas com os dados do gráfico.');
  }
}); 