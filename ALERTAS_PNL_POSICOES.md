# 🔔 Sistema de Alertas de PnL de Posições

## 📋 Visão Geral

O sistema de alertas de PnL (Profit & Loss) de posições foi implementado para notificar quando uma posição aberta atinge níveis específicos de lucro positivo. Isso permite monitorar automaticamente o desempenho das posições e tomar decisões oportunas.

## 🎯 Funcionalidades

### 1. Alertas por Threshold
- **3 níveis de alerta configurados:**
  - 🟡 **0.50%** - Primeiro nível de lucro
  - 🟢 **1.00%** - Segundo nível de lucro  
  - 🟢 **2.00%** - Terceiro nível de lucro

### 2. Controle Individual por Posição
- **Localização:** Ao lado de cada posição na seção "Posições Abertas"
- **Controle:** Botão de ativar/desativar (ícone de sino)
- **Indicador Visual:** 
  - Ícone de sino que muda de cor conforme o PnL
  - Animação pulsante quando alertando
  - Tooltip com informações detalhadas

### 3. Notificações
- **Som:** `alerta2.mp3` (2 toques)
- **Toast:** Notificação visual no canto superior direito
- **Cooldown:** 30 segundos entre alertas para evitar spam

## 🎨 Interface Visual

### Cores do Ícone
- **Cinza:** Alerta desativado
- **Amarelo:** PnL entre 0.50% e 0.99%
- **Verde claro:** PnL entre 1.00% e 1.99%
- **Verde:** PnL >= 2.00%
- **Verde pulsante:** Alertando ativamente

### Tooltip Informativo
- **Desativado:** "Ativar alertas de PnL"
- **Aguardando:** "Aguardando PnL positivo (0.50%, 1%, 2%)"
- **Ativo:** "PnL: X.XX% - Y/3 alertas disparados"

## ⚙️ Configuração Técnica

### Componentes Principais
- `PositionPnLAlert.tsx`: Componente individual de alerta
- `usePositionPnLAlerts.ts`: Hook para gerenciar configurações
- Integração na `arbitrage-table.tsx`

### Persistência
- Configurações salvas no localStorage
- Posições adicionadas automaticamente quando criadas
- Configurações mantidas entre sessões

### Critérios de Alerta
- **PnL positivo:** Apenas dispara para PnL > 0%
- **Threshold único:** Cada nível dispara apenas uma vez
- **Reset automático:** Alertas resetam quando PnL volta a zero
- **Cooldown:** 30 segundos entre alertas

## 📊 Exemplo de Funcionamento

### Cenário: Posição WHITE_USDT
1. **Posição criada:** PnL = 0%
2. **PnL sobe para 0.25%:** Sem alerta
3. **PnL atinge 0.50%:** 🎯 **ALERTA 1** - Som + Toast
4. **PnL sobe para 0.75%:** Sem alerta (já disparou para 0.50%)
5. **PnL atinge 1.00%:** 🎯 **ALERTA 2** - Som + Toast
6. **PnL sobe para 1.50%:** Sem alerta (já disparou para 1.00%)
7. **PnL atinge 2.00%:** 🎯 **ALERTA 3** - Som + Toast
8. **PnL sobe para 3.00%:** Sem alerta (todos os alertas já dispararam)
9. **PnL volta para 0%:** Alertas resetam para próximos disparos

## 🎵 Configuração de Som

### Arquivo de Som
- **Caminho:** `/public/sounds/alerta2.mp3`
- **Volume:** 70% (`volume = 0.7`)
- **Repetições:** 2 toques por alerta
- **Intervalo:** 200ms entre toques

### Personalização
Para alterar o som, modifique no componente `PositionPnLAlert.tsx`:

```typescript
soundFile = '/sounds/seu-som.mp3'
```

## 🔧 Personalização Avançada

### Alterar Thresholds
Para modificar os níveis de alerta, edite em `PositionPnLAlert.tsx`:

```typescript
const [alertLevels, setAlertLevels] = useState<AlertThreshold[]>([
  { level: 0.50, triggered: false, lastAlertTime: 0 },
  { level: 1.00, triggered: false, lastAlertTime: 0 },
  { level: 2.00, triggered: false, lastAlertTime: 0 }
]);
```

### Alterar Cooldown
Para modificar o tempo entre alertas:

```typescript
const alertCooldownRef = useRef(30000); // 30 segundos
```

### Alterar Volume
Para ajustar o volume do som:

```typescript
audioRef.current.volume = 0.7; // 0.0 a 1.0
```

## 🧪 Como Testar

### Teste Automático
```bash
node scripts/test-position-pnl-alerts.js
```

### Teste Manual
1. Acesse `http://localhost:3000/arbitragem`
2. Crie uma posição simulada
3. Clique no ícone de sino para ativar alertas
4. Monitore os alertas quando PnL atingir os thresholds
5. Verifique som e notificações

## 🚨 Troubleshooting

### Alerta não toca
1. Verifique se o navegador permite reprodução de áudio
2. Confirme se o alerta está ativo para a posição
3. Verifique se o arquivo `alerta2.mp3` existe em `/public/sounds/`

### Configurações não salvam
1. Verifique se o localStorage está habilitado
2. Limpe o cache do navegador se necessário

### Alertas não resetam
1. Verifique se o PnL voltou para zero ou negativo
2. Recarregue a página para forçar reset manual

## 📈 Performance

- **Monitoramento em tempo real:** Atualiza com preços live
- **Cooldown inteligente:** Evita spam de alertas
- **Cache otimizado:** Configurações salvas localmente
- **Reset automático:** Não requer intervenção manual

## 🎯 Casos de Uso

### Trading Ativo
- Monitorar posições abertas automaticamente
- Receber notificações de lucro atingido
- Tomar decisões de fechamento baseadas em alertas

### Análise de Performance
- Acompanhar evolução do PnL
- Identificar padrões de lucro
- Otimizar estratégias de arbitragem

### Gestão de Risco
- Alertas precoces de lucro
- Evitar perda de oportunidades
- Manter controle das posições

---

**🎉 Sistema implementado e funcionando conforme especificado!** 