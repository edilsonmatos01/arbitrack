# 🚀 INSTRUÇÕES PARA DEPLOY NA RENDER

## ❌ **PROBLEMA ATUAL**
O WebSocket não está funcionando na versão deployada porque:
- **Frontend**: Tentando conectar ao WebSocket
- **Worker**: Não está rodando na Render
- **Erro**: `Conexão WebSocket fechada: 1006`

## 🔧 **SOLUÇÃO: DOIS SERVIÇOS NA RENDER**

### **1. CONFIGURAÇÃO MANUAL NA RENDER**

#### **Serviço 1: Frontend (arbitrack-frontend)**
1. **Nome**: `arbitrack-frontend`
2. **Tipo**: Web Service
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Variáveis de Ambiente**:
   ```
   NODE_ENV=production
   PORT=10000
   NEXT_PUBLIC_WEBSOCKET_URL=wss://arbitrack-worker.onrender.com
   ```

#### **Serviço 2: Worker (arbitrack-worker)**
1. **Nome**: `arbitrack-worker`
2. **Tipo**: Web Service
3. **Build Command**: `npm install`
4. **Start Command**: `node worker/background-worker-fixed.js`
5. **Variáveis de Ambiente**:
   ```
   NODE_ENV=production
   PORT=10001
   ```

### **2. PASSOS PARA CONFIGURAR**

#### **Passo 1: Criar o Worker**
1. Acesse: https://dashboard.render.com/new/web-service
2. **Connect**: Selecione o repositório `edilsonmatos01/arbitrack`
3. **Name**: `arbitrack-worker`
4. **Environment**: Node
5. **Build Command**: `npm install`
6. **Start Command**: `node worker/background-worker-fixed.js`
7. **Plan**: Free
8. Clique em **"Create Web Service"**

#### **Passo 2: Configurar Variáveis do Worker**
1. Vá para **Environment** → **Environment Variables**
2. Adicione:
   ```
   NODE_ENV=production
   PORT=10001
   ```
3. Clique em **"Save Changes"**

#### **Passo 3: Criar o Frontend**
1. Acesse: https://dashboard.render.com/new/web-service
2. **Connect**: Selecione o repositório `edilsonmatos01/arbitrack`
3. **Name**: `arbitrack-frontend`
4. **Environment**: Node
5. **Build Command**: `npm install && npm run build`
6. **Start Command**: `npm start`
7. **Plan**: Free
8. Clique em **"Create Web Service"**

#### **Passo 4: Configurar Variáveis do Frontend**
1. Vá para **Environment** → **Environment Variables**
2. Adicione:
   ```
   NODE_ENV=production
   PORT=10000
   NEXT_PUBLIC_WEBSOCKET_URL=wss://arbitrack-worker.onrender.com
   ```
3. Clique em **"Save Changes"**

### **3. VERIFICAÇÃO**

#### **Teste do Worker**:
```bash
curl https://arbitrack-worker.onrender.com/health
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

#### **Teste do Frontend**:
```bash
curl https://arbitrack-frontend.onrender.com
```
**Resposta esperada**: Página HTML do sistema

### **4. LOGS ESPERADOS**

#### **Worker Logs**:
```
✅ WebSocket server rodando na porta 10001
⏱️ Servidor iniciado em 2025-07-26T04:20:28.000Z
🔌 Nova conexão WebSocket de [IP]
✅ Cliente conectado. Total: 1
💰 OPORTUNIDADE ENCONTRADA!
📊 WHITE_USDT: Spread = 37.0360%
```

#### **Frontend Logs**:
```
[WS Hook] Tentando conectar ao servidor WebSocket em wss://arbitrack-worker.onrender.com...
[WS Hook] ✅ Conectado ao WebSocket
[ArbitrageTable] Oportunidades recebidas: 12
```

### **5. TROUBLESHOOTING**

#### **Se o Worker não conectar**:
1. Verifique se o serviço está rodando
2. Teste o health check
3. Verifique os logs do worker

#### **Se o Frontend não conectar ao WebSocket**:
1. Verifique a URL do WebSocket
2. Confirme que o worker está rodando
3. Teste a conectividade

#### **Se não aparecer oportunidades**:
1. Verifique se os conectores estão funcionando
2. Confirme que os pares estão sendo monitorados
3. Verifique os logs de debug

## 🎯 **RESULTADO ESPERADO**

### **Sistema Funcionando**:
- ✅ **Worker**: Rodando na porta 10001
- ✅ **Frontend**: Rodando na porta 10000
- ✅ **WebSocket**: Conectado entre frontend e worker
- ✅ **Oportunidades**: Detectadas e exibidas em tempo real

### **URLs Finais**:
- **Frontend**: `https://arbitrack-frontend.onrender.com`
- **Worker**: `https://arbitrack-worker.onrender.com`
- **WebSocket**: `wss://arbitrack-worker.onrender.com`

## 🚀 **PRONTO PARA PRODUÇÃO!**

Após configurar os dois serviços, o sistema estará **100% funcional** na Render com:
- **Detecção de oportunidades** em tempo real
- **Interface web** responsiva
- **WebSocket** funcionando corretamente
- **Logs detalhados** para monitoramento

**Configure os dois serviços e o sistema funcionará perfeitamente!** 🎯 