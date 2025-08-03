require('dotenv').config();

console.log('🔍 Testando nova conexão direta...');
console.log('');

const dbConnection = require('../lib/db-connection').default;

async function testNewConnection() {
  console.log('=== TESTE: Nova Conexão Direta ===');
  
  try {
    console.log('🔌 Testando conexão...');
    
    // Teste de conexão básica
    const connectionTest = await dbConnection.testConnection();
    console.log('✅ Conexão básica OK!');
    console.log('📊 Resultado:', connectionTest[0]);
    
    // Teste de tabelas
    console.log('📋 Verificando tabelas...');
    
    const spreadCount = await dbConnection.getSpreadHistoryCount();
    console.log(`  - SpreadHistory: ${spreadCount} registros`);
    
    const operationCount = await dbConnection.getOperationHistoryCount();
    console.log(`  - OperationHistory: ${operationCount} registros`);
    
    const balanceCount = await dbConnection.getManualBalanceCount();
    console.log(`  - ManualBalance: ${balanceCount} registros`);
    
    const positionCount = await dbConnection.getPositionsCount();
    console.log(`  - Position: ${positionCount} registros`);
    
    // Teste de dados
    console.log('📊 Testando busca de dados...');
    
    const operations = await dbConnection.getOperationHistory(5);
    console.log(`  - Últimas 5 operações: ${operations.length} encontradas`);
    
    const balances = await dbConnection.getManualBalances();
    console.log(`  - Balanços manuais: ${balances.length} encontrados`);
    
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    await dbConnection.close();
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('🔍 Código:', error.code);
    await dbConnection.close();
    return false;
  }
}

testNewConnection(); 