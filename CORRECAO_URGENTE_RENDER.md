# 🚨 CORREÇÃO URGENTE - CONFIGURAÇÕES RENDER

## ❌ **PROBLEMA IDENTIFICADO**

O serviço `arbitragem-render` está rodando o **script antigo** em vez do **frontend Next.js**:

```
==> Running 'node dist/scripts/spread-monitor.js'  ❌ INCORRETO
```

## 🔧 **CORREÇÃO IMEDIATA NECESSÁRIA**

### **1. CORRIGIR SERVIÇO `arbitragem-render`**

#### **Passo 1: Acessar Dashboard**
1. Vá para: https://dashboard.render.com
2. Clique no serviço `arbitragem-render`

#### **Passo 2: Corrigir Start Command**
1. Vá em **Settings**
2. **Start Command**: Mude para `npm start`
3. Clique em **"Save Changes"**

#### **Passo 3: Verificar Build Command**
1. **Build Command**: Deve ser `npm install && npm run build`

#### **Passo 4: Verificar Variáveis de Ambiente**
Vá em **Environment** → **Environment Variables**
```
NODE_ENV=production
PORT=10000
NEXT_PUBLIC_WEBSOCKET_URL=wss://arbitrage-worker.onrender.com
```

### **2. VERIFICAR SERVIÇO `arbitrage-worker`**

#### **Passo 1: Acessar Dashboard**
1. Vá para: https://dashboard.render.com
2. Clique no serviço `arbitrage-worker`

#### **Passo 2: Verificar Start Command**
1. **Start Command**: Deve ser `node worker/background-worker-fixed.js`

#### **Passo 3: Verificar Build Command**
1. **Build Command**: Deve ser `npm install`

#### **Passo 4: Verificar Variáveis de Ambiente**
Vá em **Environment** → **Environment Variables**
```
NODE_ENV=production
PORT=10001
```

## 📋 **CHECKLIST DE VERIFICAÇÃO**

### **Serviço `arbitragem-render`**:
- ✅ **Environment**: Node
- ✅ **Build Command**: `npm install && npm run build`
- ❌ **Start Command**: `npm start` ← CORRIGIR ESTE
- ✅ **Port**: 10000
- ✅ **Variáveis**: `NODE_ENV=production`, `PORT=10000`, `NEXT_PUBLIC_WEBSOCKET_URL=wss://arbitrage-worker.onrender.com`

### **Serviço `arbitrage-worker`**:
- ✅ **Environment**: Node
- ✅ **Build Command**: `npm install`
- ❌ **Start Command**: `node worker/background-worker-fixed.js` ← VERIFICAR ESTE
- ✅ **Port**: 10001
- ✅ **Variáveis**: `NODE_ENV=production`, `PORT=10001`

## 🚀 **APÓS CORREÇÃO**

### **1. Aguardar Deploy**
- Render fará deploy automático
- Aguarde 2-3 minutos

### **2. Testar Frontend**
```bash
curl https://arbitragem-render.onrender.com
```
**Resposta esperada**: Página HTML do Next.js

### **3. Testar Worker**
```bash
curl https://arbitrage-worker.onrender.com/health
```
**Resposta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2025-07-26T04:20:28.000Z",
  "clients": 0,
  "gateioSymbols": 80,
  "mexcSymbols": 58
}
```

### **4. Testar WebSocket**
```bash
node test-websocket-direct.js
```
**Resposta esperada**: WebSocket conectado e recebendo mensagens

## 🎯 **RESULTADO ESPERADO**

Após corrigir o Start Command:
- ✅ **Frontend**: Next.js rodando na porta 10000
- ✅ **Worker**: WebSocket server rodando na porta 10001
- ✅ **Interface**: Acessível via navegador
- ✅ **WebSocket**: Conectando entre frontend e worker
- ✅ **Oportunidades**: Detectadas e exibidas em tempo real

## ⚠️ **IMPORTANTE**

**A correção principal é mudar o Start Command do `arbitragem-render` de:**
```
node dist/scripts/spread-monitor.js  ❌
```
**Para:**
```
npm start  ✅
```

**Isso fará o serviço rodar o frontend Next.js em vez do script antigo!**

## 🚀 **PRONTO PARA PRODUÇÃO!**

Após corrigir o Start Command, o sistema estará **100% funcional** na Render! 🎯 