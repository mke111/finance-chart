// data.js - Data fetching from Yahoo Finance, Frankfurter, CoinGecko

const SYMBOLS = {
  us: [
    { code: 'AAPL', name: 'Apple Inc.', type: 'us' },
    { code: 'MSFT', name: 'Microsoft', type: 'us' },
    { code: 'GOOGL', name: 'Alphabet', type: 'us' },
    { code: 'AMZN', name: 'Amazon', type: 'us' },
    { code: 'NVDA', name: 'NVIDIA', type: 'us' },
    { code: 'TSLA', name: 'Tesla', type: 'us' },
    { code: 'META', name: 'Meta', type: 'us' },
    { code: 'BRK-B', name: 'Berkshire B', type: 'us' },
    { code: 'JPM', name: 'JPMorgan', type: 'us' },
    { code: 'V', name: 'Visa', type: 'us' },
    { code: 'SPY', name: 'S&P 500 ETF', type: 'us' },
    { code: 'QQQ', name: 'Nasdaq ETF', type: 'us' },
  ],
  hk: [
    { code: '0700.HK', name: '腾讯控股', type: 'hk' },
    { code: '9988.HK', name: '阿里巴巴', type: 'hk' },
    { code: '3690.HK', name: '美团', type: 'hk' },
    { code: '0941.HK', name: '中国移动', type: 'hk' },
    { code: '1299.HK', name: '友邦保险', type: 'hk' },
    { code: '0005.HK', name: '汇丰控股', type: 'hk' },
    { code: '2318.HK', name: '中国平安', type: 'hk' },
    { code: '0388.HK', name: '香港交易所', type: 'hk' },
  ],
  cn: [
    { code: '600519.SS', name: '贵州茅台', type: 'cn' },
    { code: '000858.SZ', name: '五粮液', type: 'cn' },
    { code: '601318.SS', name: '中国平安', type: 'cn' },
    { code: '000001.SZ', name: '平安银行', type: 'cn' },
    { code: '600036.SS', name: '招商银行', type: 'cn' },
    { code: '000333.SZ', name: '美的集团', type: 'cn' },
    { code: '002594.SZ', name: '比亚迪', type: 'cn' },
    { code: '601166.SS', name: '兴业银行', type: 'cn' },
  ],
  fx: [
    { code: 'EURUSD=X', name: 'EUR/USD', type: 'fx', base: 'EUR', quote: 'USD' },
    { code: 'GBPUSD=X', name: 'GBP/USD', type: 'fx', base: 'GBP', quote: 'USD' },
    { code: 'USDJPY=X', name: 'USD/JPY', type: 'fx', base: 'USD', quote: 'JPY' },
    { code: 'USDCNH=X', name: 'USD/CNH', type: 'fx', base: 'USD', quote: 'CNH' },
    { code: 'AUDUSD=X', name: 'AUD/USD', type: 'fx', base: 'AUD', quote: 'USD' },
    { code: 'USDCAD=X', name: 'USD/CAD', type: 'fx', base: 'USD', quote: 'CAD' },
  ],
  metal: [
    { code: 'GC=F', name: '黄金', type: 'metal' },
    { code: 'SI=F', name: '白银', type: 'metal' },
    { code: 'PL=F', name: '铂金', type: 'metal' },
    { code: 'HG=F', name: '铜', type: 'metal' },
    { code: 'CL=F', name: '原油', type: 'metal' },
  ],
  crypto: [
    { code: 'bitcoin', name: 'Bitcoin (BTC)', type: 'crypto', cgId: 'bitcoin' },
    { code: 'ethereum', name: 'Ethereum (ETH)', type: 'crypto', cgId: 'ethereum' },
    { code: 'solana', name: 'Solana (SOL)', type: 'crypto', cgId: 'solana' },
    { code: 'binancecoin', name: 'BNB', type: 'crypto', cgId: 'binancecoin' },
    { code: 'ripple', name: 'XRP', type: 'crypto', cgId: 'ripple' },
    { code: 'dogecoin', name: 'Dogecoin (DOGE)', type: 'crypto', cgId: 'dogecoin' },
  ]
};

// All symbols flat list for search
const ALL_SYMBOLS = Object.values(SYMBOLS).flat();

// Yahoo Finance via local proxy
async function fetchYahoo(symbol, interval, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
  const proxy = `/api/proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxy);
  if (!res.ok) throw new Error('Yahoo fetch failed');
  return res.json();
}

// Map timeframe to Yahoo interval + range
function tfToYahoo(tf) {
  const map = {
    '1m':  { interval: '1m',  range: '1d' },
    '5m':  { interval: '5m',  range: '5d' },
    '15m': { interval: '15m', range: '5d' },
    '30m': { interval: '30m', range: '1mo' },
    '1h':  { interval: '1h',  range: '3mo' },
    '4h':  { interval: '1h',  range: '6mo' },  // Yahoo has no 4h; use 1h with longer range
    '1D':  { interval: '1d',  range: '2y' },
    '1W':  { interval: '1wk', range: '5y' },
    '1M':  { interval: '1mo', range: '10y' },
  };
  return map[tf] || map['1D'];
}

// Parse Yahoo response into OHLCV array
function parseYahoo(json) {
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  const timestamps = result.timestamp;
  const q = result.indicators.quote[0];
  const data = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (!q.open[i] || !q.close[i]) continue;
    data.push({
      time: timestamps[i],
      open: parseFloat(q.open[i].toFixed(4)),
      high: parseFloat(q.high[i].toFixed(4)),
      low: parseFloat(q.low[i].toFixed(4)),
      close: parseFloat(q.close[i].toFixed(4)),
      volume: q.volume[i] || 0,
    });
  }
  return data;
}

// Binance OHLC (无需key，稳定)
const BINANCE_SYMBOL_MAP = {
  bitcoin: 'BTCUSDT', ethereum: 'ETHUSDT', solana: 'SOLUSDT',
  binancecoin: 'BNBUSDT', ripple: 'XRPUSDT', dogecoin: 'DOGEUSDT',
  cardano: 'ADAUSDT', polkadot: 'DOTUSDT', avalanche: 'AVAXUSDT',
  chainlink: 'LINKUSDT', uniswap: 'UNIUSDT', litecoin: 'LTCUSDT',
};

function tfToBinance(tf) {
  const map = { '1m':'1m','5m':'5m','15m':'15m','30m':'30m','1h':'1h','4h':'4h','1D':'1d','1W':'1w','1M':'1M' };
  return map[tf] || '1d';
}

async function fetchBinance(cgId, tf) {
  const symbol = BINANCE_SYMBOL_MAP[cgId] || (cgId.toUpperCase() + 'USDT');
  const interval = tfToBinance(tf);
  const limit = 500;
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const proxy = `/api/proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxy);
  if (!res.ok) throw new Error('Binance fetch failed');
  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error('Binance bad response');
  return raw.map(k => ({
    time: Math.floor(k[0] / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

async function fetchBinanceQuote(cgId) {
  const symbol = BINANCE_SYMBOL_MAP[cgId] || (cgId.toUpperCase() + 'USDT');
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
  const proxy = `/api/proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxy);
  if (!res.ok) throw new Error('Binance quote failed');
  const d = await res.json();
  return {
    price: parseFloat(d.lastPrice),
    change: parseFloat(d.priceChangePercent),
    volume: parseFloat(d.quoteVolume),
  };
}

// Generate realistic mock data as fallback
function generateMockData(symbol, tf) {
  const now = Math.floor(Date.now() / 1000);
  const tfSeconds = { '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '4h': 14400, '1D': 86400, '1W': 604800, '1M': 2592000 };
  const step = tfSeconds[tf] || 86400;
  const count = 500;
  const data = [];

  // Seed price based on symbol
  const seeds = { AAPL: 185, MSFT: 415, GOOGL: 175, NVDA: 875, TSLA: 245, bitcoin: 65000, ethereum: 3500, GC: 2050, SI: 24 };
  let price = seeds[symbol] || seeds[symbol.split('.')[0]] || 100;
  const volatility = price > 1000 ? 0.015 : price > 100 ? 0.012 : 0.018;

  for (let i = count; i >= 0; i--) {
    const time = now - i * step;
    const change = (Math.random() - 0.495) * volatility;
    price = price * (1 + change);
    const range = price * volatility * 0.8;
    const open = price * (1 + (Math.random() - 0.5) * 0.005);
    const close = price;
    const high = Math.max(open, close) + Math.random() * range;
    const low = Math.min(open, close) - Math.random() * range;
    const volume = Math.floor(Math.random() * 5000000 + 500000);
    data.push({ time, open: +open.toFixed(4), high: +high.toFixed(4), low: +low.toFixed(4), close: +close.toFixed(4), volume });
  }
  return data;
}

// Main fetch function
async function fetchOHLCV(symbolObj, tf) {
  try {
    if (symbolObj.type === 'crypto') {
      return await fetchBinance(symbolObj.cgId || symbolObj.code, tf);
    } else {
      const { interval, range } = tfToYahoo(tf);
      const json = await fetchYahoo(symbolObj.code, interval, range);
      const data = parseYahoo(json);
      if (data.length < 10) throw new Error('Insufficient data');
      return data;
    }
  } catch (e) {
    console.warn(`[data] Falling back to mock for ${symbolObj.code}:`, e.message);
    return generateMockData(symbolObj.code, tf);
  }
}

// Fetch current quote
async function fetchQuote(symbolObj) {
  try {
    if (symbolObj.type === 'crypto') {
      return await fetchBinanceQuote(symbolObj.cgId || symbolObj.code);
    } else {
      const { interval, range } = tfToYahoo('1D');
      const json = await fetchYahoo(symbolObj.code, interval, range);
      const r = json?.chart?.result?.[0];
      if (!r) return null;
      const meta = r.meta;
      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose || meta.previousClose;
      const change = prev ? ((price - prev) / prev * 100) : 0;
      return { price, change, volume: meta.regularMarketVolume };
    }
  } catch (e) {
    return null;
  }
}
