# Solução para Problema de Inicialização

## Problema Identificado

O erro `Cannot find module '@prisma/client'` ocorre porque as dependências não estão instaladas ou o cliente Prisma não foi gerado.

## Soluções Disponíveis

### 1. Script de Diagnóstico (Recomendado Primeiro)

Execute para identificar problemas:

```bash
node diagnose-system.js
```

ou

```bash
npm run diagnose
```

### 2. Script de Instalação e Inicialização (Solução Completa)

Este script resolve todos os problemas automaticamente:

```bash
node install-and-start.js
```

ou

```bash
npm run install:start
```

### 3. Scripts Alternativos

Se o script principal não funcionar, use estas alternativas:

```bash
# Script simples
node start-simple.js

# Script completo (versão corrigida)
node start-final-working.js
```

## Passos para Resolver o Problema

### Passo 1: Diagnóstico
```bash
node diagnose-system.js
```

### Passo 2: Configuração (se necessário)
```bash
node setup-initial-config.js
```

### Passo 3: Instalação e Inicialização
```bash
node install-and-start.js
```

## O que cada script faz:

### `diagnose-system.js`
- Verifica se todos os arquivos necessários existem
- Testa se Node.js e npm estão funcionando
- Verifica se as dependências estão instaladas
- Testa se o Prisma está configurado
- Verifica se os builds estão funcionando

### `install-and-start.js`
- Instala todas as dependências automaticamente
- Gera o cliente Prisma
- Compila o worker e a aplicação web
- Inicia o sistema completo

### `start-simple.js`
- Versão simplificada que instala dependências
- Inicia o sistema de forma mais direta

## Comandos de Emergência

Se nada funcionar, execute manualmente:

```bash
# 1. Instalar dependências
npm install

# 2. Gerar cliente Prisma
npx prisma generate

# 3. Compilar worker
npm run build:worker

# 4. Compilar aplicação web
npm run build

# 5. Iniciar sistema
node install-and-start.js
```

## Verificação de Sucesso

Após executar com sucesso, você deve ver:

1. **Worker iniciado**: Mensagens do worker no console
2. **Servidor web**: Disponível em `http://localhost:10000`
3. **Logs**: Informações sobre o funcionamento do sistema

## Troubleshooting

### Erro: "Cannot find module '@prisma/client'"
**Solução**: Execute `node install-and-start.js`

### Erro: "Arquivo .env não encontrado"
**Solução**: Execute `node setup-initial-config.js`

### Erro: "Build failed"
**Solução**: Execute `npm run build:worker` e `npm run build`

### Erro: "Database connection failed"
**Solução**: Verifique se o banco de dados está rodando e acessível

## Scripts Disponíveis

| Script | Comando | Função |
|--------|---------|--------|
| `diagnose-system.js` | `node diagnose-system.js` | Diagnostica problemas |
| `install-and-start.js` | `node install-and-start.js` | Instala e inicia |
| `start-simple.js` | `node start-simple.js` | Versão simplificada |
| `setup-initial-config.js` | `node setup-initial-config.js` | Configuração inicial |
| `start-final-working.js` | `node start-final-working.js` | Script completo |

## Comandos npm

| Comando | Função |
|---------|--------|
| `npm run diagnose` | Diagnóstico do sistema |
| `npm run install:start` | Instalar e iniciar |
| `npm run start:simple` | Iniciar versão simples |
| `npm run setup:initial` | Configuração inicial |
| `npm run start:final` | Script completo |

## Logs

Todos os scripts geram logs detalhados. Verifique:
- Console: Para informações em tempo real
- `startup-logs.txt`: Para logs persistentes (quando disponível)

## Suporte

Se ainda houver problemas:

1. Execute `node diagnose-system.js` e siga as instruções
2. Verifique se Node.js está atualizado
3. Verifique se todas as dependências estão instaladas
4. Verifique se o banco de dados está acessível
5. Verifique se as portas estão disponíveis 