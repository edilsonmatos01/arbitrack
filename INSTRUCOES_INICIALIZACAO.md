# Instruções de Inicialização - Sistema de Arbitragem

## Visão Geral

Este sistema possui um script de inicialização único que configura e inicia todos os componentes necessários automaticamente, evitando que as configurações se percam ao reiniciar o computador.

## Scripts Disponíveis

### 1. Configuração Inicial (Primeira Vez)
```bash
node setup-initial-config.js
```
ou
```bash
npm run setup:initial
```

**O que faz:**
- Cria arquivo `.env` com configurações personalizadas
- Verifica dependências do sistema
- Instala dependências se necessário
- Configura banco de dados
- Compila worker e aplicação web
- Testa conectividade

### 2. Inicialização do Sistema
```bash
node start-final-working.js
```
ou
```bash
npm run start:final
```

**O que faz:**
- Verifica ambiente e dependências
- Configura banco de dados
- Inicia worker de monitoramento
- Inicia servidor web
- Monitora saúde do sistema
- Reinicia componentes automaticamente se necessário

## Passos para Primeira Configuração

### 1. Preparação do Ambiente
Certifique-se de ter instalado:
- Node.js (versão 16 ou superior)
- npm ou pnpm
- PostgreSQL (ou outro banco suportado pelo Prisma)

### 2. Configuração Inicial
```bash
# Clone o repositório (se ainda não fez)
git clone <seu-repositorio>
cd arbitragem-render-03

# Execute a configuração inicial
node setup-initial-config.js
```

O script irá solicitar:
- URL do banco de dados
- Porta do servidor web
- API Keys (opcional)

### 3. Iniciar o Sistema
```bash
node start-final-working.js
```

## Configurações Persistentes

O script `start-final-working.js` garante que as configurações sejam mantidas através de:

### 1. Verificação de Ambiente
- Verifica se arquivo `.env` existe
- Cria configurações padrão se necessário
- Valida variáveis críticas

### 2. Verificação de Dependências
- Confirma existência de arquivos necessários
- Compila componentes se necessário
- Executa migrações do banco

### 3. Monitoramento de Saúde
- Verifica conexão com banco de dados
- Monitora processos em execução
- Reinicia componentes automaticamente

### 4. Logs Detalhados
- Salva logs em `startup-logs.txt`
- Registra todas as operações
- Facilita diagnóstico de problemas

## Estrutura de Arquivos

```
arbitragem-render-03/
├── start-final-working.js          # Script principal de inicialização
├── setup-initial-config.js         # Script de configuração inicial
├── .env                            # Configurações do ambiente
├── startup-logs.txt               # Logs de inicialização
├── package.json                   # Dependências e scripts
└── ...
```

## Comandos Úteis

### Verificar Status do Sistema
```bash
# Verificar se o sistema está rodando
curl http://localhost:10000/api/health

# Verificar logs
tail -f startup-logs.txt
```

### Reiniciar Sistema
```bash
# Parar sistema (Ctrl+C)
# Iniciar novamente
node start-final-working.js
```

### Configuração Manual
Se precisar ajustar configurações manualmente:

1. Edite o arquivo `.env`
2. Reinicie o sistema: `node start-final-working.js`

## Solução de Problemas

### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar configurações no .env
cat .env | grep DATABASE_URL
```

### Erro de Compilação
```bash
# Limpar cache e reinstalar dependências
rm -rf node_modules
npm install

# Recompilar
npm run build:worker
npm run build
```

### Erro de Porta
```bash
# Verificar se a porta está em uso
lsof -i :10000

# Alterar porta no .env
echo "PORT=10001" >> .env
```

## Configuração Automática no Boot (Linux)

Para iniciar automaticamente ao ligar o computador:

### 1. Criar Script de Serviço
```bash
sudo nano /etc/systemd/system/arbitragem.service
```

### 2. Conteúdo do Serviço
```ini
[Unit]
Description=Sistema de Arbitragem
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/arbitragem-render-03
ExecStart=/usr/bin/node start-final-working.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Ativar Serviço
```bash
sudo systemctl enable arbitragem.service
sudo systemctl start arbitragem.service
```

## Monitoramento

O sistema inclui monitoramento automático:

- **Health Check**: Verifica saúde a cada 30 segundos
- **Auto-restart**: Reinicia componentes que param
- **Logs**: Registra todas as operações
- **Circuit Breaker**: Protege contra falhas em cascata

## Segurança

- API Keys são opcionais
- Configurações sensíveis ficam no `.env`
- Logs não incluem informações sensíveis
- Conexões usam HTTPS quando disponível

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs em `startup-logs.txt`
2. Teste conectividade com banco de dados
3. Verifique se todas as dependências estão instaladas
4. Confirme se as portas estão disponíveis 