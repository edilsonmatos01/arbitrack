const fetch = require('node-fetch');

// Configurações
const API_BASE = 'http://localhost:3000/api';
const TEST_USER = 'edilsonmatos';

console.log('🧪 Teste da API de Posições - Corrigida com Prisma ORM');
console.log('');

async function testPositionsAPI() {
  try {
    // Teste 1: GET - Buscar posições
    console.log('📋 Teste 1: Buscando posições...');
    const getResponse = await fetch(`${API_BASE}/positions?user_id=${TEST_USER}`);
    const getData = await getResponse.json();
    
    console.log(`✅ Status: ${getResponse.status}`);
    console.log(`📊 Posições encontradas: ${getData.length}`);
    console.log(`⏱️  Tempo de resposta: ${getResponse.headers.get('x-response-time') || 'N/A'}`);
    
    if (getData.length > 0) {
      console.log(`📝 Primeira posição:`, {
        id: getData[0].id,
        symbol: getData[0].symbol,
        quantity: getData[0].quantity
      });
    }
    console.log('');

    // Teste 2: POST - Criar nova posição
    console.log('➕ Teste 2: Criando nova posição...');
    const newPosition = {
      symbol: 'TEST_USDT',
      quantity: 100,
      spotEntry: 1.50,
      futuresEntry: 1.52,
      spotExchange: 'gateio',
      futuresExchange: 'mexc',
      isSimulated: true
    };
    
    const postResponse = await fetch(`${API_BASE}/positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPosition)
    });
    
    const postData = await postResponse.json();
    console.log(`✅ Status: ${postResponse.status}`);
    
    if (postResponse.ok) {
      console.log(`✅ Posição criada com ID: ${postData.id}`);
      console.log(`📊 Dados:`, {
        symbol: postData.symbol,
        quantity: postData.quantity,
        spotEntry: postData.spotEntry,
        futuresEntry: postData.futuresEntry
      });
      
      // Teste 3: DELETE - Remover posição criada
      console.log('');
      console.log('🗑️  Teste 3: Removendo posição criada...');
      const deleteResponse = await fetch(`${API_BASE}/positions?id=${postData.id}`, {
        method: 'DELETE'
      });
      
      const deleteData = await deleteResponse.json();
      console.log(`✅ Status: ${deleteResponse.status}`);
      console.log(`✅ Mensagem: ${deleteData.message}`);
    } else {
      console.log(`❌ Erro: ${postData.error}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testPositionsAPI(); 