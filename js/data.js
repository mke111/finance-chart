// data.js - Data fetching from Yahoo Finance, Frankfurter, CoinGecko

const SYMBOLS = {
  us: [
    { code: 'AAPL', name: 'Apple', type: 'us' },
    { code: 'MSFT', name: 'Microsoft', type: 'us' },
    { code: 'GOOGL', name: 'Alphabet', type: 'us' },
    { code: 'AMZN', name: 'Amazon', type: 'us' },
    { code: 'NVDA', name: 'NVIDIA', type: 'us' },
    { code: 'TSLA', name: 'Tesla', type: 'us' },
    { code: 'META', name: 'Meta', type: 'us' },
    { code: 'BRK-B', name: 'Berkshire B', type: 'us' },
    { code: 'JPM', name: 'JPMorgan', type: 'us' },
    { code: 'V', name: 'Visa', type: 'us' },
    { code: 'MA', name: 'Mastercard', type: 'us' },
    { code: 'UNH', name: 'UnitedHealth', type: 'us' },
    { code: 'XOM', name: 'ExxonMobil', type: 'us' },
    { code: 'JNJ', name: 'Johnson & Johnson', type: 'us' },
    { code: 'WMT', name: 'Walmart', type: 'us' },
    { code: 'PG', name: 'Procter & Gamble', type: 'us' },
    { code: 'LLY', name: 'Eli Lilly', type: 'us' },
    { code: 'HD', name: 'Home Depot', type: 'us' },
    { code: 'AVGO', name: 'Broadcom', type: 'us' },
    { code: 'COST', name: 'Costco', type: 'us' },
    { code: 'NFLX', name: 'Netflix', type: 'us' },
    { code: 'AMD', name: 'AMD', type: 'us' },
    { code: 'INTC', name: 'Intel', type: 'us' },
    { code: 'QCOM', name: 'Qualcomm', type: 'us' },
    { code: 'ORCL', name: 'Oracle', type: 'us' },
    { code: 'CRM', name: 'Salesforce', type: 'us' },
    { code: 'ADBE', name: 'Adobe', type: 'us' },
    { code: 'IBM', name: 'IBM', type: 'us' },
    { code: 'PYPL', name: 'PayPal', type: 'us' },
    { code: 'UBER', name: 'Uber', type: 'us' },
    { code: 'ABNB', name: 'Airbnb', type: 'us' },
    { code: 'SHOP', name: 'Shopify', type: 'us' },
    { code: 'SQ', name: 'Block', type: 'us' },
    { code: 'COIN', name: 'Coinbase', type: 'us' },
    { code: 'PLTR', name: 'Palantir', type: 'us' },
    { code: 'ARM', name: 'ARM Holdings', type: 'us' },
    { code: 'SMCI', name: 'Super Micro', type: 'us' },
    { code: 'MU', name: 'Micron', type: 'us' },
    { code: 'AMAT', name: 'Applied Materials', type: 'us' },
    { code: 'LRCX', name: 'Lam Research', type: 'us' },
    { code: 'SPY', name: 'S&P 500 ETF', type: 'us' },
    { code: 'QQQ', name: 'Nasdaq ETF', type: 'us' },
    { code: 'DIA', name: 'Dow Jones ETF', type: 'us' },
    { code: 'IWM', name: 'Russell 2000 ETF', type: 'us' },
    { code: 'VIX', name: 'VIX 恐慌指数', type: 'us' },
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
    { code: '9618.HK', name: '京东', type: 'hk' },
    { code: '9999.HK', name: '网易', type: 'hk' },
    { code: '1810.HK', name: '小米集团', type: 'hk' },
    { code: '0020.HK', name: '商汤科技', type: 'hk' },
    { code: '2382.HK', name: '舜宇光学', type: 'hk' },
    { code: '0175.HK', name: '吉利汽车', type: 'hk' },
    { code: '1211.HK', name: '比亚迪股份', type: 'hk' },
    { code: '0883.HK', name: '中国海洋石油', type: 'hk' },
    { code: '0857.HK', name: '中国石油', type: 'hk' },
    { code: '1398.HK', name: '工商银行', type: 'hk' },
    { code: '0939.HK', name: '建设银行', type: 'hk' },
    { code: '3988.HK', name: '中国银行', type: 'hk' },
    { code: '0386.HK', name: '中国石化', type: 'hk' },
    { code: '2628.HK', name: '中国人寿', type: 'hk' },
    { code: '6690.HK', name: '海尔智家', type: 'hk' },
    { code: '0992.HK', name: '联想集团', type: 'hk' },
    { code: '9868.HK', name: '小鹏汽车', type: 'hk' },
    { code: '2015.HK', name: '理想汽车', type: 'hk' },
    { code: '9866.HK', name: '蔚来', type: 'hk' },
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
    { code: '600900.SS', name: '长江电力', type: 'cn' },
    { code: '601888.SS', name: '中国中免', type: 'cn' },
    { code: '000725.SZ', name: '京东方A', type: 'cn' },
    { code: '002415.SZ', name: '海康威视', type: 'cn' },
    { code: '600276.SS', name: '恒瑞医药', type: 'cn' },
    { code: '300750.SZ', name: '宁德时代', type: 'cn' },
    { code: '601012.SS', name: '隆基绿能', type: 'cn' },
    { code: '000002.SZ', name: '万科A', type: 'cn' },
    { code: '600030.SS', name: '中信证券', type: 'cn' },
    { code: '601628.SS', name: '中国人寿', type: 'cn' },
    { code: '600000.SS', name: '浦发银行', type: 'cn' },
    { code: '601398.SS', name: '工商银行', type: 'cn' },
    { code: '601939.SS', name: '建设银行', type: 'cn' },
    { code: '600028.SS', name: '中国石化', type: 'cn' },
    { code: '601857.SS', name: '中国石油', type: 'cn' },
    { code: '002352.SZ', name: '顺丰控股', type: 'cn' },
    { code: '300059.SZ', name: '东方财富', type: 'cn' },
  ],
  fx: [
    { code: 'EURUSD=X', name: 'EUR/USD', type: 'fx' },
    { code: 'GBPUSD=X', name: 'GBP/USD', type: 'fx' },
    { code: 'USDJPY=X', name: 'USD/JPY', type: 'fx' },
    { code: 'USDCNH=X', name: 'USD/CNH', type: 'fx' },
    { code: 'AUDUSD=X', name: 'AUD/USD', type: 'fx' },
    { code: 'USDCAD=X', name: 'USD/CAD', type: 'fx' },
    { code: 'USDCHF=X', name: 'USD/CHF', type: 'fx' },
    { code: 'NZDUSD=X', name: 'NZD/USD', type: 'fx' },
    { code: 'EURGBP=X', name: 'EUR/GBP', type: 'fx' },
    { code: 'EURJPY=X', name: 'EUR/JPY', type: 'fx' },
    { code: 'GBPJPY=X', name: 'GBP/JPY', type: 'fx' },
    { code: 'USDHKD=X', name: 'USD/HKD', type: 'fx' },
    { code: 'USDSGD=X', name: 'USD/SGD', type: 'fx' },
    { code: 'USDKRW=X', name: 'USD/KRW', type: 'fx' },
    { code: 'USDINR=X', name: 'USD/INR', type: 'fx' },
    { code: 'USDBRL=X', name: 'USD/BRL', type: 'fx' },
    { code: 'USDMXN=X', name: 'USD/MXN', type: 'fx' },
    { code: 'USDRUB=X', name: 'USD/RUB', type: 'fx' },
    { code: 'USDTRY=X', name: 'USD/TRY', type: 'fx' },
    { code: 'USDZAR=X', name: 'USD/ZAR', type: 'fx' },
  ],
  metal: [
    { code: 'GC=F', name: '黄金', type: 'metal' },
    { code: 'SI=F', name: '白银', type: 'metal' },
    { code: 'PL=F', name: '铂金', type: 'metal' },
    { code: 'PA=F', name: '钯金', type: 'metal' },
    { code: 'HG=F', name: '铜', type: 'metal' },
    { code: 'CL=F', name: 'WTI原油', type: 'metal' },
    { code: 'BZ=F', name: '布伦特原油', type: 'metal' },
    { code: 'NG=F', name: '天然气', type: 'metal' },
    { code: 'ZW=F', name: '小麦', type: 'metal' },
    { code: 'ZC=F', name: '玉米', type: 'metal' },
    { code: 'ZS=F', name: '大豆', type: 'metal' },
    { code: 'KC=F', name: '咖啡', type: 'metal' },
    { code: 'CT=F', name: '棉花', type: 'metal' },
  ],
  crypto: [
    { code: 'bitcoin', name: 'Bitcoin BTC', type: 'crypto', cgId: 'bitcoin' },
    { code: 'ethereum', name: 'Ethereum ETH', type: 'crypto', cgId: 'ethereum' },
    { code: 'solana', name: 'Solana SOL', type: 'crypto', cgId: 'solana' },
    { code: 'binancecoin', name: 'BNB', type: 'crypto', cgId: 'binancecoin' },
    { code: 'ripple', name: 'XRP', type: 'crypto', cgId: 'ripple' },
    { code: 'dogecoin', name: 'Dogecoin DOGE', type: 'crypto', cgId: 'dogecoin' },
    { code: 'cardano', name: 'Cardano ADA', type: 'crypto', cgId: 'cardano' },
    { code: 'avalanche', name: 'Avalanche AVAX', type: 'crypto', cgId: 'avalanche' },
    { code: 'polkadot', name: 'Polkadot DOT', type: 'crypto', cgId: 'polkadot' },
    { code: 'chainlink', name: 'Chainlink LINK', type: 'crypto', cgId: 'chainlink' },
    { code: 'uniswap', name: 'Uniswap UNI', type: 'crypto', cgId: 'uniswap' },
    { code: 'litecoin', name: 'Litecoin LTC', type: 'crypto', cgId: 'litecoin' },
    { code: 'stellar', name: 'Stellar XLM', type: 'crypto', cgId: 'stellar' },
    { code: 'monero', name: 'Monero XMR', type: 'crypto', cgId: 'monero' },
    { code: 'toncoin', name: 'Toncoin TON', type: 'crypto', cgId: 'toncoin' },
    { code: 'shiba-inu', name: 'Shiba Inu SHIB', type: 'crypto', cgId: 'shiba-inu' },
    { code: 'pepe', name: 'Pepe PEPE', type: 'crypto', cgId: 'pepe' },
    { code: 'sui', name: 'Sui SUI', type: 'crypto', cgId: 'sui' },
    { code: 'aptos', name: 'Aptos APT', type: 'crypto', cgId: 'aptos' },
    { code: 'arbitrum', name: 'Arbitrum ARB', type: 'crypto', cgId: 'arbitrum' },
    { code: 'optimism', name: 'Optimism OP', type: 'crypto', cgId: 'optimism' },
    { code: 'near', name: 'NEAR Protocol', type: 'crypto', cgId: 'near' },
    { code: 'internet-computer', name: 'ICP', type: 'crypto', cgId: 'internet-computer' },
    { code: 'filecoin', name: 'Filecoin FIL', type: 'crypto', cgId: 'filecoin' },
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
