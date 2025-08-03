// Script para aplicar índices no banco de dados
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyIndexes() {
  console.log('=== APLICANDO ÍNDICES NO BANCO DE DADOS ===');
  console.log('Data/Hora:', new Date().toISOString());
  console.log('');

  try {
    // Ler o script SQL
    const sqlPath = path.join(__dirname, 'apply-database-indexes.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Script SQL carregado com sucesso');
    console.log('Tamanho do script:', sqlContent.length, 'caracteres');
    console.log('');

    // Dividir o script em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`Executando ${commands.length} comandos...`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        console.log(`[${i + 1}/${commands.length}] Executando comando...`);
        
        if (command.includes('CREATE INDEX')) {
          console.log('  Criando índice...');
        } else if (command.includes('SET ')) {
          console.log('  Configurando parâmetro...');
        } else if (command.includes('ANALYZE')) {
          console.log('  Analisando tabela...');
        } else if (command.includes('SELECT')) {
          console.log('  Verificando índices...');
        }

        const result = await prisma.$executeRawUnsafe(command);
        
        if (command.includes('SELECT')) {
          console.log('  Resultado da verificação:', result);
        } else {
          console.log('  ✓ Comando executado com sucesso');
        }
        
        successCount++;
        
        // Pequena pausa entre comandos
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`  ✗ Erro: ${error.message}`);
        errorCount++;
      }
    }

    console.log('');
    console.log('=== RESUMO ===');
    console.log(`Comandos executados com sucesso: ${successCount}`);
    console.log(`Comandos com erro: ${errorCount}`);
    console.log(`Taxa de sucesso: ${((successCount / commands.length) * 100).toFixed(1)}%`);

    if (errorCount === 0) {
      console.log('');
      console.log('✅ Todos os índices foram aplicados com sucesso!');
      console.log('🔄 Reinicie o servidor para aplicar as otimizações');
    } else {
      console.log('');
      console.log('⚠️  Alguns comandos falharam. Verifique os erros acima.');
    }

  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
applyIndexes().catch(console.error); 