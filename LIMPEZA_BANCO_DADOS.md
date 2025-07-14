# Limpeza do Banco de Dados

Este documento descreve os scripts disponíveis para limpeza e manutenção do banco de dados do sistema de arbitragem.

## Problema Identificado

O cronjob de limpeza automática não estava funcionando corretamente para a tabela `SpreadHistory`, resultando em acúmulo de dados antigos. Foram criados scripts alternativos para garantir a limpeza adequada.

## Scripts Disponíveis

### 1. Limpeza Automática (Cronjob)
```bash
npm run clean:db:scheduled
```
- **Função:** Executa limpeza automática diária às 02:00
- **Tabelas:** `SpreadHistory` e `PriceHistory`
- **Critério:** Remove registros com mais de 24 horas
- **Status:** Melhorado com logs detalhados e verificações

### 2. Limpeza Manual da SpreadHistory
```bash
npm run clean:spread-history
```
- **Função:** Limpeza específica da tabela `SpreadHistory`
- **Critério:** Remove registros com mais de 24 horas
- **Logs:** Detalhados com contadores antes/depois
- **Recomendado:** Para limpeza manual quando necessário

### 3. Verificação e Limpeza Condicional
```bash
npm run check-spreads
npm run check-spreads -- --force
```
- **Função:** Verifica status da tabela e opcionalmente executa limpeza
- **Modo:** Apenas verificação (sem `--force`)
- **Modo:** Verificação + limpeza (com `--force`)
- **Logs:** Informações detalhadas sobre registros antigos

### 4. Teste de Limpeza
```bash
npm run test-cleanup
npm run test-cleanup -- --execute
```
- **Função:** Simula limpeza sem executar (modo teste)
- **Modo:** Execução real (com `--execute`)
- **Útil:** Para verificar se a limpeza funcionaria corretamente

## Como Usar

### Limpeza Imediata
```bash
# Limpeza manual da SpreadHistory
npm run clean:spread-history

# Verificar e limpar se necessário
npm run check-spreads -- --force
```

### Verificação sem Limpeza
```bash
# Apenas verificar status
npm run check-spreads

# Testar limpeza (simulação)
npm run test-cleanup
```

### Limpeza Completa do Banco
```bash
# Limpeza de todas as tabelas
npm run clean:db:scheduled -- --manual
```

## Logs e Monitoramento

Todos os scripts agora incluem logs detalhados com:
- 📊 Contadores antes e depois da limpeza
- 📅 Datas dos registros mais antigos
- ⏰ Idade dos registros em horas
- ✅ Confirmação de sucesso ou ❌ erros
- 🎯 Registros específicos que foram removidos

## Exemplo de Saída

```
🧹 Iniciando limpeza manual da tabela SpreadHistory...
📊 Total de registros antes da limpeza: 15420
📅 Registros anteriores a 2024-01-15T10:00:00.000Z: 12340
✅ 12340 registros antigos removidos de SpreadHistory.
📊 Total de registros após a limpeza: 3080
📅 Registro mais antigo restante: 2024-01-15T10:05:23.456Z
🎉 Limpeza concluída com sucesso!
🔌 Conexão com o banco fechada.
```

## Troubleshooting

### Se a limpeza não funcionar:
1. Verifique se o banco está acessível
2. Execute `npm run check-spreads` para diagnóstico
3. Use `npm run test-cleanup` para simular
4. Execute limpeza manual com `npm run clean:spread-history`

### Se houver muitos registros antigos:
1. Execute `npm run check-spreads -- --force`
2. Monitore os logs para confirmar remoção
3. Verifique se o cronjob está rodando: `npm run clean:db:scheduled`

## Configuração do Cronjob

O cronjob está configurado para rodar diariamente às 02:00:
```javascript
cron.schedule('0 2 * * *', async () => {
    // Limpeza automática
});
```

Para verificar se está funcionando, monitore os logs do servidor ou execute manualmente para teste. 