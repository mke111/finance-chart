// i18n.js - Internationalization support

const i18n = (() => {
  const dict = {
    zh: {
      // Page title & logo
      pageTitle: '金融图表 - Finance Chart',
      logo: '📈 FinChart',

      // Toolbar
      indicator: '指标',
      overlayIndicators: '叠加指标',
      subIndicators: '副图指标',
      williamsR: '威廉指标',

      // Chart type titles
      candlestick: 'K线',
      line: '折线',
      area: '面积',

      // Category tabs
      us: '美股',
      hk: '港股',
      cn: 'A股',
      fx: '外汇',
      metal: '贵金属',
      crypto: '加密',

      // Search
      searchPlaceholder: '搜索代码/名称...',

      // Signal panel
      signalTitle: '📊 交易信号',
      signalWaiting: '等待数据',
      signalDisclaimer: '⚠️ 以上信号仅供参考，不构成投资建议',
      strongBuy: '强烈买入',
      buy: '建议买入',
      neutral: '中性观望',
      neutralHint: '中性',
      sell: '建议卖出',
      strongSell: '强烈卖出',

      // Signal hints
      goldenCross: '金叉',
      deathCross: '死叉',
      bullish: '偏多',
      bearish: '偏空',
      bullishAlign: '多头排列',
      bearishAlign: '空头排列',
      overbought: '超买',
      oversold: '超卖',
      aboveMid: '上方',
      belowMid: '下方',
      aboveVwap: 'VWAP上方',
      belowVwap: 'VWAP下方',

      // Loading
      loading: '加载中...',

      // Search
      searchDirect: '直接查询此代码',

      // Lang toggle
      langToggle: 'EN',
    },
    en: {
      pageTitle: 'Finance Chart',
      logo: '📈 FinChart',

      indicator: 'Indicators',
      overlayIndicators: 'Overlay',
      subIndicators: 'Sub-chart',
      williamsR: 'Williams %R',

      candlestick: 'Candlestick',
      line: 'Line',
      area: 'Area',

      us: 'US',
      hk: 'HK',
      cn: 'CN',
      fx: 'FX',
      metal: 'Metals',
      crypto: 'Crypto',

      searchPlaceholder: 'Search symbol/name...',

      signalTitle: '📊 Trade Signal',
      signalWaiting: 'Waiting for data',
      signalDisclaimer: '⚠️ Signals are for reference only, not investment advice',
      strongBuy: 'Strong Buy',
      buy: 'Buy',
      neutral: 'Neutral',
      neutralHint: 'Neutral',
      sell: 'Sell',
      strongSell: 'Strong Sell',

      goldenCross: 'Golden Cross',
      deathCross: 'Death Cross',
      bullish: 'Bullish',
      bearish: 'Bearish',
      bullishAlign: 'Bullish Align',
      bearishAlign: 'Bearish Align',
      overbought: 'Overbought',
      oversold: 'Oversold',
      aboveMid: 'Above Mid',
      belowMid: 'Below Mid',
      aboveVwap: 'Above VWAP',
      belowVwap: 'Below VWAP',

      loading: 'Loading...',

      // Search
      searchDirect: 'Search this symbol',

      langToggle: '中',
    }
  };

  let lang = localStorage.getItem('fc_lang') || 'zh';

  function t(key) {
    return (dict[lang] && dict[lang][key]) || (dict['zh'][key]) || key;
  }

  function setLang(l) {
    lang = l;
    localStorage.setItem('fc_lang', l);
    applyAll();
  }

  function getLang() {
    return lang;
  }

  function applyAll() {
    // data-i18n text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });
    // data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    // data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });
    // page title
    document.title = t('pageTitle');
    // lang toggle button shows the OTHER language
    const btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.textContent = t('langToggle');
  }

  function toggle() {
    setLang(lang === 'zh' ? 'en' : 'zh');
  }

  return { t, setLang, getLang, applyAll, toggle };
})();
