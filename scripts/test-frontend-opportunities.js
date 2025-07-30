const puppeteer = require('puppeteer');

console.log('🧪 TESTE - FRONTEND RECEBENDO OPORTUNIDADES');
console.log('==========================================');

async function testFrontendOpportunities() {
  let browser;
  
  try {
    // Iniciar navegador
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Interceptar mensagens do console
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WS Hook]') || text.includes('[ArbitrageTable]') || text.includes('opportunity')) {
        console.log(`📱 Frontend: ${text}`);
      }
    });
    
    // Interceptar erros
    page.on('pageerror', error => {
      console.error(`❌ Erro no frontend: ${error.message}`);
    });
    
    console.log('🌐 Navegando para o frontend...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    
    console.log('⏰ Aguardando 10 segundos para carregar...');
    await page.waitForTimeout(10000);
    
    // Verificar se há oportunidades na tabela
    const opportunitiesCount = await page.evaluate(() => {
      const table = document.querySelector('table tbody');
      if (!table) return 0;
      
      const rows = table.querySelectorAll('tr');
      let count = 0;
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0 && !row.textContent.includes('Nenhuma oportunidade encontrada')) {
          count++;
        }
      });
      
      return count;
    });
    
    console.log(`📊 Oportunidades encontradas na tabela: ${opportunitiesCount}`);
    
    if (opportunitiesCount > 0) {
      console.log('✅ SUCESSO: Frontend está recebendo e exibindo oportunidades!');
    } else {
      console.log('⚠️  PROBLEMA: Nenhuma oportunidade encontrada na tabela');
      console.log('   - Verificar se o WebSocket está conectando');
      console.log('   - Verificar se as oportunidades estão chegando');
    }
    
    // Aguardar mais 10 segundos para ver se aparecem oportunidades
    console.log('⏰ Aguardando mais 10 segundos...');
    await page.waitForTimeout(10000);
    
    const finalCount = await page.evaluate(() => {
      const table = document.querySelector('table tbody');
      if (!table) return 0;
      
      const rows = table.querySelectorAll('tr');
      let count = 0;
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0 && !row.textContent.includes('Nenhuma oportunidade encontrada')) {
          count++;
        }
      });
      
      return count;
    });
    
    console.log(`📊 Oportunidades finais na tabela: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testFrontendOpportunities(); 