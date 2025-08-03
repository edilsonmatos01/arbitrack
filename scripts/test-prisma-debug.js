const fetch = require('node-fetch');

const baseURL = 'http://localhost:10000';

async function testPrismaDebug() {
  console.log('🔍 Testando debug do Prisma na API...\n');
  
  try {
    const response = await fetch(`${baseURL}/api/init-data?user_id=edilsonmatos`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API respondeu com sucesso');
      console.log('📊 Dados retornados:');
      console.log(`   - Posições: ${data.positions?.closed?.length || 0}`);
      console.log(`   - Spreads: ${Object.keys(data.spreads?.data || {}).length}`);
      
      // Verificar se são dados mockados
      const isMocked = data.positions?.closed?.some(pos => pos._id === 'pos_mock_1' || pos._id === 'pos_error_1');
      if (isMocked) {
        console.log('⚠️  Dados MOCKADOS detectados (Prisma não está funcionando)');
      } else {
        console.log('✅ Dados REAIS detectados (Prisma funcionando)');
      }
      
      // Mostrar alguns exemplos
      if (data.positions?.closed?.length > 0) {
        console.log('📋 Exemplo de posição:', data.positions.closed[0]);
      }
      
      if (Object.keys(data.spreads?.data || {}).length > 0) {
        const firstSpread = Object.entries(data.spreads.data)[0];
        console.log('📈 Exemplo de spread:', firstSpread);
      }
      
    } else {
      console.log(`❌ Erro na API: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`💥 Erro de conexão: ${error.message}`);
  }
}

testPrismaDebug().catch(console.error); 