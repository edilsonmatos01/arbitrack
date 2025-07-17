const fetch = require('node-fetch');

async function testPositionsAPI() {
  console.log('=== TESTE DA API DE POSIÇÕES ===');
  
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:10000';
  const apiURL = `${baseURL}/api/positions`;
  
  console.log(`Testando API em: ${apiURL}`);
  
  try {
    console.log('\n📡 Fazendo requisição GET...');
    const startTime = Date.now();
    
    const response = await fetch(apiURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 segundos de timeout
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Tempo de resposta: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Sucesso! ${Array.isArray(data) ? data.length : 'Dados recebidos'}`);
      
      if (Array.isArray(data)) {
        console.log(`📋 Total de posições: ${data.length}`);
        if (data.length > 0) {
          console.log('📝 Primeira posição:', JSON.stringify(data[0], null, 2));
        }
      } else {
        console.log('📝 Resposta:', JSON.stringify(data, null, 2));
      }
    } else {
      console.log('❌ Erro na resposta');
      const errorText = await response.text();
      console.log('📝 Detalhes do erro:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Servidor não está rodando ou não acessível');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 Host não encontrado');
    } else if (error.name === 'TimeoutError') {
      console.log('⏰ Timeout na requisição');
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n=== TESTE DE CONEXÃO COM BANCO ===');
  
  try {
    // Verificar se o arquivo de configuração do Prisma existe
    const fs = require('fs');
    const path = require('path');
    
    const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaSchemaPath)) {
      console.log('✅ Schema do Prisma encontrado');
    } else {
      console.log('❌ Schema do Prisma não encontrado');
    }
    
    // Verificar variáveis de ambiente
    console.log('\n🔧 Variáveis de ambiente:');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Definida' : 'Não definida');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'Não definida');
    
  } catch (error) {
    console.error('💥 Erro ao verificar configuração:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando testes da API de posições...\n');
  
  await testDatabaseConnection();
  await testPositionsAPI();
  
  console.log('\n=== SUGESTÕES DE SOLUÇÃO ===');
  console.log('1. Verifique se o servidor está rodando: npm run dev');
  console.log('2. Verifique a conexão com o banco de dados');
  console.log('3. Verifique as variáveis de ambiente DATABASE_URL');
  console.log('4. Execute: npx prisma db push (se necessário)');
  console.log('5. Verifique os logs do servidor para mais detalhes');
}

main().catch(console.error); 