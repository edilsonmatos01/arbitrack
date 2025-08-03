// Teste das variáveis de ambiente em produção
console.log('🧪 Teste das Variáveis de Ambiente em Produção');

function testEnvironmentVariables() {
  console.log('\n1. Verificando variáveis de ambiente...');
  
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
    DATABASE_URL: process.env.DATABASE_URL ? 'Definida' : 'Não definida',
    PORT: process.env.PORT,
    HOSTNAME: process.env.HOSTNAME,
    TZ: process.env.TZ
  };
  
  console.log('📋 Variáveis de ambiente:');
  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`   ${status} ${key}: ${value || 'Não definida'}`);
  });
  
  console.log('\n2. Verificando configuração do WebSocket...');
  
  if (envVars.NEXT_PUBLIC_WEBSOCKET_URL) {
    console.log('✅ NEXT_PUBLIC_WEBSOCKET_URL está definida');
    console.log('🔗 URL:', envVars.NEXT_PUBLIC_WEBSOCKET_URL);
    
    // Verificar se é uma URL válida
    try {
      const url = new URL(envVars.NEXT_PUBLIC_WEBSOCKET_URL);
      console.log('✅ URL válida:', url.protocol, '//', url.host);
    } catch (error) {
      console.error('❌ URL inválida:', error.message);
    }
  } else {
    console.error('❌ NEXT_PUBLIC_WEBSOCKET_URL não está definida!');
    console.log('🔧 Isso pode causar falhas na conexão WebSocket');
  }
  
  console.log('\n3. Verificando ambiente...');
  console.log('🌍 NODE_ENV:', envVars.NODE_ENV);
  
  if (envVars.NODE_ENV === 'production') {
    console.log('✅ Ambiente de produção detectado');
    console.log('📱 Variáveis NEXT_PUBLIC_* devem estar disponíveis no cliente');
  } else {
    console.log('⚠️ Ambiente de desenvolvimento');
    console.log('🔧 Verificar se as variáveis estão no .env.local');
  }
  
  console.log('\n4. Diagnóstico...');
  
  if (!envVars.NEXT_PUBLIC_WEBSOCKET_URL) {
    console.log('❌ PROBLEMA: NEXT_PUBLIC_WEBSOCKET_URL não definida');
    console.log('🔧 Solução: Adicionar no render.yaml ou variáveis de ambiente');
  } else {
    console.log('✅ WebSocket configurado corretamente');
  }
  
  return {
    success: !!envVars.NEXT_PUBLIC_WEBSOCKET_URL,
    envVars
  };
}

// Executar teste
const result = testEnvironmentVariables();

if (result.success) {
  console.log('\n🎉 CONFIGURAÇÃO CORRETA!');
  console.log('📱 WebSocket deve funcionar em produção');
} else {
  console.log('\n⚠️ CONFIGURAÇÃO INCORRETA!');
  console.log('🔧 Verificar variáveis de ambiente no Render');
} 