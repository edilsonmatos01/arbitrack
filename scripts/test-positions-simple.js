const fetch = require('node-fetch');

async function testPositionsAPI() {
  console.log('=== TESTE SIMPLES DA API DE POSIÇÕES ===');
  
  const baseURL = 'http://localhost:10000';
  const apiURL = `${baseURL}/api/positions`;
  
  console.log(`Testando API em: ${apiURL}`);
  
  // Teste 1: GET básico
  console.log('\n📡 Teste 1: GET básico');
  try {
    const response = await fetch(apiURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso! Dados recebidos:', Array.isArray(data) ? `${data.length} posições` : 'Resposta válida');
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na resposta');
      console.log('Detalhes:', errorText.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }
  
  // Teste 2: POST para criar uma posição
  console.log('\n📡 Teste 2: POST para criar posição');
  try {
    const testPosition = {
      symbol: "BTC_USDT",
      quantity: 0.001,
      spotEntry: 50000,
      futuresEntry: 50250,
      spotExchange: "gateio",
      futuresExchange: "mexc",
      isSimulated: true
    };
    
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPosition),
      timeout: 5000
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Posição criada com sucesso!');
      console.log('ID da posição:', data.id);
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao criar posição');
      console.log('Detalhes:', errorText.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('💥 Erro na requisição POST:', error.message);
  }
  
  // Teste 3: Verificar se a posição foi criada
  console.log('\n📡 Teste 3: Verificar posições após criação');
  try {
    const response = await fetch(apiURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${data.length} posições encontradas`);
      if (data.length > 0) {
        console.log('Primeira posição:', {
          id: data[0].id,
          symbol: data[0].symbol,
          quantity: data[0].quantity,
          createdAt: data[0].createdAt
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao buscar posições');
      console.log('Detalhes:', errorText.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('💥 Erro na requisição GET:', error.message);
  }
}

async function testOtherAPIs() {
  console.log('\n=== TESTE DE OUTRAS APIs ===');
  
  const baseURL = 'http://localhost:10000';
  const apis = [
    '/api/health',
    '/api/spreads/max',
    '/api/average-spread'
  ];
  
  for (const api of apis) {
    console.log(`\n📡 Testando: ${api}`);
    try {
      const response = await fetch(`${baseURL}${api}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ API funcionando');
      } else {
        console.log('❌ API com erro');
      }
    } catch (error) {
      console.error('💥 Erro:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando testes da API de posições...\n');
  
  await testPositionsAPI();
  await testOtherAPIs();
  
  console.log('\n=== DIAGNÓSTICO ===');
  console.log('Se a API de posições retornar 404, pode ser:');
  console.log('1. Problema com o roteamento do Next.js');
  console.log('2. Arquivo route.ts não está sendo reconhecido');
  console.log('3. Problema com a configuração do servidor');
  console.log('4. Variável DATABASE_URL não definida');
}

main().catch(console.error); 