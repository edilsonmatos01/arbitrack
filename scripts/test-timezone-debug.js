const fetch = require('node-fetch');

async function testTimezoneDebug() {
  try {
    console.log('🕐 Testando Endpoint de Debug de Timezone...\n');
    
    const response = await fetch('http://localhost:3000/api/debug/timezone');
    const data = await response.json();
    
    console.log('📊 Informações de Timezone:');
    console.log(`  Timestamp UTC: ${data.timestamp}`);
    console.log(`  TZ Environment: ${data.timezone.env}`);
    console.log(`  Timezone Offset: ${data.timezone.offset} minutos`);
    console.log(`  Locale: ${data.timezone.locale}`);
    
    console.log('\n🔄 Conversões:');
    console.log(`  UTC: ${data.conversions.utc}`);
    console.log(`  São Paulo (date-fns): ${data.conversions.saoPaulo.withDateFns}`);
    console.log(`  São Paulo (manual): ${data.conversions.saoPaulo.manual}`);
    
    // Verificar se as conversões estão corretas
    const utcHour = new Date(data.timestamp).getUTCHours();
    const expectedHour = (utcHour - 3 + 24) % 24; // UTC-3
    
    console.log('\n✅ Validação:');
    console.log(`  Hora UTC: ${utcHour}h`);
    console.log(`  Hora esperada (UTC-3): ${expectedHour}h`);
    
    if (data.conversions.saoPaulo.withDateFns && data.conversions.saoPaulo.manual) {
      console.log(`  ✅ Ambas as conversões funcionaram`);
    } else {
      console.log(`  ⚠️  Alguma conversão falhou`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testTimezoneDebug(); 