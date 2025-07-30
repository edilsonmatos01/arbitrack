# Robo de Arbitragem

Monitor e robô de arbitragem que verifica os preços de criptomoedas nas exchanges Gate.io e MEXC, calcula o spread entre elas e fornece uma interface web para visualização e acompanhamento.

## Funcionalidades

- Monitora preços de criptomoedas contra USDT em tempo real
- Calcula o spread entre as exchanges
- Interface web moderna com Next.js para visualização dos dados
- Salva os dados em um banco PostgreSQL
- Limpa automaticamente dados mais antigos que 24 horas
- Sistema de websockets para atualizações em tempo real
- Suporte para múltiplas exchanges (Gate.io e MEXC)

## Pré-requisitos

- Node.js (v18 ou superior)
- npm ou pnpm
- PostgreSQL

## Configuração do Ambiente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/edilsonmatos01/arbitragem-render.git
    cd arbitragem-render
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```
    ou
    ```bash
    pnpm install
    ```

3.  **Configuração do Banco de Dados:**
    - Crie um banco de dados PostgreSQL
    - Crie um arquivo `.env` na raiz do projeto
    - Adicione as seguintes variáveis de ambiente:
    
    ```
    DATABASE_URL="sua_url_do_postgresql"
    NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3001"
    MEXC_API_KEY="sua_chave_api_mexc"
    MEXC_SECRET="seu_secret_mexc"
    GATE_API_KEY="sua_chave_api_gate"
    GATE_SECRET="seu_secret_gate"
    ```

4.  **Execute as migrações do Prisma:**
    ```bash
    npx prisma migrate dev
    ```

## Inicialização Rápida

### Método Recomendado (Script Único)

Para iniciar o sistema com um único comando que configura tudo automaticamente:

```bash
# Primeira vez (configuração inicial)
node setup-initial-config.js

# Diagnóstico do sistema
node diagnose-system.js

# Instalar dependências e iniciar
node install-and-start.js
```

ou usando npm:
```bash
# Primeira vez (configuração inicial)
npm run setup:initial

# Diagnóstico do sistema
npm run diagnose

# Instalar dependências e iniciar
npm run install:start
```

### Windows

Para Windows, use os scripts específicos:

```bash
# Script batch simples
start-windows.bat

# Script PowerShell avançado
.\start-windows.ps1

# Com configuração inicial
.\start-windows.ps1 -Setup
```

### Método Manual

Para iniciar o ambiente de desenvolvimento local, que inclui o frontend Next.js e o robô de monitoramento de spreads, execute:

```bash
npm run dev
```

Isso iniciará:
- O servidor de desenvolvimento do Next.js em `http://localhost:3000`
- O robô de monitoramento de spreads (`spread-tracker`)
- O servidor de websockets para atualizações em tempo real

## Scripts Disponíveis

### Scripts de Inicialização (Recomendados)
- `npm run start:final`: Inicia o sistema completo com um comando
- `npm run setup:initial`: Configuração inicial do sistema
- `node start-final-working.js`: Script principal de inicialização
- `node setup-initial-config.js`: Script de configuração inicial

### Scripts de Desenvolvimento
- `npm run dev`: Inicia o ambiente de desenvolvimento completo
- `npm run build`: Compila o projeto Next.js e o robô de spreads para produção
- `npm run start`: Inicia o projeto em modo de produção
- `npm run dev:tracker`: Inicia apenas o robô de monitoramento em modo de desenvolvimento com hot-reload
- `npm run start:tracker`: Inicia apenas o robô de monitoramento em modo de produção
- `npm run prisma:deploy`: Executa as migrações do banco de dados em produção

## Persistência de Configurações

O sistema foi projetado para manter as configurações mesmo após reiniciar o computador:

### Recursos de Persistência
- **Verificação Automática**: O script verifica e recria configurações se necessário
- **Monitoramento de Saúde**: Reinicia componentes automaticamente se pararem
- **Logs Persistentes**: Todas as operações são registradas em `startup-logs.txt`
- **Configuração Única**: Um único comando inicia todo o sistema

### Arquivos de Configuração
- `.env`: Configurações do ambiente (criado automaticamente se não existir)
- `startup-logs.txt`: Logs de inicialização e operação
- `dist/`: Arquivos compilados (gerados automaticamente)

### Inicialização Automática (Linux)
Para iniciar automaticamente ao ligar o computador:

```bash
# Criar serviço systemd
sudo nano /etc/systemd/system/arbitragem.service

# Conteúdo do arquivo:
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

# Ativar serviço
sudo systemctl enable arbitragem.service
sudo systemctl start arbitragem.service
```

## Deploy no Render

Este projeto está configurado para deploy contínuo no Render a partir do GitHub.

### Configuração no Render

1.  **Serviço Web (Frontend):**
    - **Build Command:** `npm install && npm install typescript @types/node --save && npm run build && npm run prisma:deploy`
    - **Start Command:** `npm start`
    - **Variáveis de Ambiente:**
      - `NODE_ENV=production`
      - `DATABASE_URL` (do banco PostgreSQL do Render)
      - `NEXT_PUBLIC_WEBSOCKET_URL=wss://robo-de-arbitragem-tracker.onrender.com`
      - Chaves de API das exchanges (MEXC e Gate.io)

2.  **Serviço Web (Tracker):**
    - **Build Command:** `npm install && npm run build:tracker`
    - **Start Command:** `npm run start:tracker`
    - **Variáveis de Ambiente:**
      - `NODE_ENV=production`
      - `DATABASE_URL` (do banco PostgreSQL do Render)
      - Chaves de API das exchanges (MEXC e Gate.io)

O Render irá automaticamente fazer o deploy de novas versões a cada push para a branch principal do seu repositório.
