// Script para criar dados de fallback para APIs
// Usado quando o banco de dados não está disponível

const fallbackData = {
  // Dados de spread para 24h
  spreadHistory: {
    'BTC_USDT': {
      spMax: 2.85,
      spMin: -1.23,
      crosses: 156,
      exchanges: ['gateio_mexc', 'bitget_mexc'],
      lastUpdate: new Date().toISOString()
    },
    'ETH_USDT': {
      spMax: 1.92,
      spMin: -0.87,
      crosses: 134,
      exchanges: ['gateio_mexc'],
      lastUpdate: new Date().toISOString()
    },
    'SOL_USDT': {
      spMax: 3.45,
      spMin: -0.56,
      crosses: 89,
      exchanges: ['bitget_mexc'],
      lastUpdate: new Date().toISOString()
    },
    'BNB_USDT': {
      spMax: 1.67,
      spMin: -0.92,
      crosses: 112,
      exchanges: ['gateio_mexc', 'mexc_bitget'],
      lastUpdate: new Date().toISOString()
    },
    'XRP_USDT': {
      spMax: 2.34,
      spMin: -1.45,
      crosses: 78,
      exchanges: ['gateio_mexc'],
      lastUpdate: new Date().toISOString()
    },
    'ADA_USDT': {
      spMax: 1.89,
      spMin: -0.67,
      crosses: 95,
      exchanges: ['mexc_bitget'],
      lastUpdate: new Date().toISOString()
    },
    'DOT_USDT': {
      spMax: 2.12,
      spMin: -0.89,
      crosses: 67,
      exchanges: ['gateio_mexc'],
      lastUpdate: new Date().toISOString()
    },
    'LINK_USDT': {
      spMax: 1.76,
      spMin: -0.78,
      crosses: 82,
      exchanges: ['bitget_mexc'],
      lastUpdate: new Date().toISOString()
    },
    'UNI_USDT': {
      spMax: 2.01,
      spMin: -1.12,
      crosses: 73,
      exchanges: ['gateio_mexc', 'mexc_bitget'],
      lastUpdate: new Date().toISOString()
    },
    'MATIC_USDT': {
      spMax: 1.98,
      spMin: -0.94,
      crosses: 91,
      exchanges: ['gateio_mexc'],
      lastUpdate: new Date().toISOString()
    }
  },

  // Dados de saldo das exchanges
  balances: {
    binance: {
      total: 12543.67,
      available: 11892.45,
      inOrder: 651.22,
      currencies: [
        { currency: 'USDT', free: '8923.45', used: '123.67', total: '9047.12' },
        { currency: 'BTC', free: '0.0234', used: '0.0012', total: '0.0246' },
        { currency: 'ETH', free: '0.156', used: '0.023', total: '0.179' }
      ]
    },
    gateio: {
      total: 8765.23,
      available: 8234.12,
      inOrder: 531.11,
      currencies: [
        { currency: 'USDT', free: '6234.12', used: '89.34', total: '6323.46' },
        { currency: 'BTC', free: '0.0189', used: '0.0008', total: '0.0197' },
        { currency: 'ETH', free: '0.123', used: '0.015', total: '0.138' }
      ]
    },
    mexc: {
      total: 5432.89,
      available: 5123.45,
      inOrder: 309.44,
      currencies: [
        { currency: 'USDT', free: '4123.45', used: '67.89', total: '4191.34' },
        { currency: 'BTC', free: '0.0123', used: '0.0005', total: '0.0128' },
        { currency: 'ETH', free: '0.089', used: '0.008', total: '0.097' }
      ]
    },
    bitget: {
      total: 3456.78,
      available: 3234.56,
      inOrder: 222.22,
      currencies: [
        { currency: 'USDT', free: '2234.56', used: '45.67', total: '2280.23' },
        { currency: 'BTC', free: '0.0078', used: '0.0003', total: '0.0081' },
        { currency: 'ETH', free: '0.056', used: '0.004', total: '0.060' }
      ]
    },
    bybit: {
      total: 2345.67,
      available: 2189.34,
      inOrder: 156.33,
      currencies: [
        { currency: 'USDT', free: '1689.34', used: '23.45', total: '1712.79' },
        { currency: 'BTC', free: '0.0056', used: '0.0002', total: '0.0058' },
        { currency: 'ETH', free: '0.034', used: '0.002', total: '0.036' }
      ]
    }
  },

  // Dados de oportunidades de arbitragem
  arbitrageOpportunities: [
    {
      symbol: 'BTC_USDT',
      exchange1: 'gateio',
      exchange2: 'mexc',
      price1: 43256.78,
      price2: 43189.45,
      spread: 1.56,
      volume: 125.67,
      timestamp: new Date().toISOString()
    },
    {
      symbol: 'ETH_USDT',
      exchange1: 'binance',
      exchange2: 'gateio',
      price1: 2345.67,
      price2: 2341.23,
      spread: 1.89,
      volume: 89.34,
      timestamp: new Date().toISOString()
    },
    {
      symbol: 'SOL_USDT',
      exchange1: 'mexc',
      exchange2: 'bitget',
      price1: 123.45,
      price2: 122.89,
      spread: 2.34,
      volume: 456.78,
      timestamp: new Date().toISOString()
    }
  ],

  // Dados de histórico de operações
  operationHistory: [
    {
      id: 1,
      symbol: 'BTC_USDT',
      type: 'BUY',
      exchange: 'gateio',
      price: 43256.78,
      amount: 0.001,
      total: 43.26,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'COMPLETED'
    },
    {
      id: 2,
      symbol: 'ETH_USDT',
      type: 'SELL',
      exchange: 'mexc',
      price: 2341.23,
      amount: 0.01,
      total: 23.41,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'COMPLETED'
    },
    {
      id: 3,
      symbol: 'SOL_USDT',
      type: 'BUY',
      exchange: 'bitget',
      price: 122.89,
      amount: 0.1,
      total: 12.29,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      status: 'PENDING'
    }
  ],

  // Dados de posições
  positions: {
    open: [
      {
        id: 1,
        symbol: 'BTC_USDT',
        exchange: 'gateio',
        side: 'LONG',
        entryPrice: 43256.78,
        currentPrice: 43345.67,
        amount: 0.001,
        pnl: 0.89,
        pnlPercent: 2.06,
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ],
    closed: [
      {
        id: 2,
        symbol: 'ETH_USDT',
        exchange: 'mexc',
        side: 'SHORT',
        entryPrice: 2341.23,
        exitPrice: 2334.56,
        amount: 0.01,
        pnl: 6.67,
        pnlPercent: 2.85,
        entryTime: new Date(Date.now() - 7200000).toISOString(),
        exitTime: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  },

  // Configurações
  config: {
    apiKeys: {
      gateio: { key: '***', secret: '***' },
      mexc: { key: '***', secret: '***' },
      binance: { key: '***', secret: '***' },
      bitget: { key: '***', secret: '***' },
      bybit: { key: '***', secret: '***' }
    },
    manualBalances: [
      { id: 1, name: 'Carteira Principal', balance: 50000, currency: 'USDT' },
      { id: 2, name: 'Carteira Secundária', balance: 25000, currency: 'USDT' }
    ]
  }
};

// Função para gerar dados dinâmicos
function generateDynamicData() {
  const now = new Date();
  const baseTime = now.getTime();
  
  // Gerar dados de spread com variação temporal
  const dynamicSpreads = {};
  Object.keys(fallbackData.spreadHistory).forEach(symbol => {
    const baseData = fallbackData.spreadHistory[symbol];
    const timeVariation = Math.sin(baseTime / 1000000) * 0.5;
    
    dynamicSpreads[symbol] = {
      ...baseData,
      spMax: baseData.spMax + timeVariation,
      spMin: baseData.spMin - timeVariation,
      crosses: baseData.crosses + Math.floor(Math.random() * 10),
      lastUpdate: now.toISOString()
    };
  });

  return {
    ...fallbackData,
    spreadHistory: dynamicSpreads
  };
}

// Exportar dados
module.exports = {
  fallbackData,
  generateDynamicData,
  
  // Função para obter dados de fallback
  getFallbackData: (type, options = {}) => {
    const data = generateDynamicData();
    
    switch (type) {
      case 'spread-history':
        return data.spreadHistory;
      
      case 'balances':
        return options.exchange ? data.balances[options.exchange] : data.balances;
      
      case 'arbitrage-opportunities':
        return data.arbitrageOpportunities;
      
      case 'operation-history':
        return data.operationHistory;
      
      case 'positions':
        return data.positions;
      
      case 'config':
        return data.config;
      
      case 'init-data':
        return {
          positions: data.positions,
          spreads: { data: data.spreadHistory },
          pairs: {
            gateio: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
            mexc: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT'],
            bitget: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT']
          }
        };
      
      default:
        return data;
    }
  }
};

console.log('✅ Dados de fallback criados com sucesso!');
console.log('Use: const { getFallbackData } = require("./scripts/create-fallback-data.js")'); 