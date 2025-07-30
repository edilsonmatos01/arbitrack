import fetch from 'node-fetch';

const SYMBOLS = [
  'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'TRX/USDT', 'LTC/USDT',
  'MATIC/USDT', 'LINK/USDT', 'ATOM/USDT', 'NEAR/USDT', 'FIL/USDT', 'AAVE/USDT', 'UNI/USDT', 'FTM/USDT', 'INJ/USDT', 'RNDR/USDT',
  'ARB/USDT', 'OP/USDT', 'SUI/USDT', 'LDO/USDT', 'DYDX/USDT', 'GRT/USDT', '1INCH/USDT',
  'APE/USDT', 'GMT/USDT', 'FLOW/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT',
  'DOGE/USDT', 'SHIB/USDT', 'WIF/USDT', 'TURBO/USDT', '1000SATS/USDT',
  'TON/USDT', 'APT/USDT', 'SEI/USDT'
];

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:10000';

async function prefetchAll() {
  for (const symbol of SYMBOLS) {
    try {
      const spreadRes = await fetch(`${BASE_URL}/api/spread-history/24h/${encodeURIComponent(symbol)}`);
      if (spreadRes.ok) {
        console.log(`[Worker] Spread 24h cache atualizado para ${symbol}`);
      }
      const priceRes = await fetch(`${BASE_URL}/api/price-comparison/${encodeURIComponent(symbol)}`);
      if (priceRes.ok) {
        console.log(`[Worker] Spot vs Futures cache atualizado para ${symbol}`);
      }
    } catch (err) {
      console.error(`[Worker] Erro ao atualizar cache para ${symbol}:`, err);
    }
  }
}

// Executa a cada 5 minutos
setInterval(prefetchAll, 5 * 60 * 1000);
prefetchAll(); 