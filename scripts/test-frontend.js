const puppeteer = require('puppeteer');

async function testFrontend() {
  console.log('Testando frontend...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurar logs do console
    page.on('console', msg => {
      console.log('Browser:', msg.text());
    });
    
    // Navegar para a página
    console.log('Navegando para http://localhost:10000/arbitragem...');
    await page.goto('http://localhost:10000/arbitragem', { waitUntil: 'networkidle0' });
    
    // Aguardar um pouco para carregar
    await page.waitForTimeout(5000);
    
    // Verificar se a tabela está presente
    const tableExists = await page.$('table');
    console.log('Tabela encontrada:', !!tableExists);
    
    // Verificar se há linhas na tabela
    const rows = await page.$$('tbody tr');
    console.log('Linhas na tabela:', rows.length);
    
    // Verificar se há células de spread máximo
    const maxSpreadCells = await page.$$('[class*="text-gray-400"]');
    console.log('Células de spread máximo:', maxSpreadCells.length);
    
    // Fazer screenshot
    await page.screenshot({ path: 'test-frontend.png', fullPage: true });
    console.log('Screenshot salvo como test-frontend.png');
    
    // Verificar logs do console para erros
    const logs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    
    console.log('Logs do console:', logs);
    
  } catch (error) {
    console.error('Erro no teste do frontend:', error.message);
  } finally {
    await browser.close();
  }
}

testFrontend(); 