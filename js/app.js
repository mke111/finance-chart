// app.js - Main application logic

const App = (() => {
  let currentSymbol = SYMBOLS.us[0];
  let currentTf = '1D';
  let currentChartType = 'candlestick';
  let activeIndicators = new Set(['VOL']);
  let priceUpdateTimer = null;

  function init() {
    ChartManager.init();
    renderSymbolList('us');
    bindToolbar();
    bindSidebar();
    bindIndicatorMenu();
    loadSymbol(currentSymbol, true);
    // Default VOL panel
    ChartManager.addIndicatorPanel('VOL');
    startPriceUpdater();
    // Apply i18n (respects saved language preference)
    i18n.applyAll();
  }

  // ===== Symbol Loading =====
  async function loadSymbol(symbolObj, fitContent = false) {
    currentSymbol = symbolObj;
    showLoading(true);
    updateSymbolHeader(symbolObj);
    setActiveSymbolInList(symbolObj.code);
    try {
      const data = await fetchOHLCV(symbolObj, currentTf);
      ChartManager.setData(data);
      if (fitContent) ChartManager.resizeAll();
      updateSignal(data);
    } catch (e) {
      console.error('loadSymbol error:', e);
    } finally {
      showLoading(false);
    }
    fetchAndUpdateQuote(symbolObj);
  }

  async function fetchAndUpdateQuote(symbolObj) {
    const q = await fetchQuote(symbolObj);
    if (!q) return;
    const priceEl = document.getElementById('current-price');
    const changeEl = document.getElementById('current-change');
    const changePctEl = document.getElementById('current-change-pct');
    if (priceEl) priceEl.textContent = fmtPrice(q.price);
    if (changeEl && changePctEl) {
      const sign = q.change >= 0 ? '+' : '';
      const cls = q.change >= 0 ? 'up' : 'down';
      changeEl.textContent = `${sign}${(q.price * q.change / 100).toFixed(2)}`;
      changeEl.className = cls;
      changePctEl.textContent = `(${sign}${q.change.toFixed(2)}%)`;
      changePctEl.className = cls;
    }
    // Update symbol list price
    updateSymbolPrice(symbolObj.code, q);
  }

  function startPriceUpdater() {
    if (priceUpdateTimer) clearInterval(priceUpdateTimer);
    priceUpdateTimer = setInterval(async () => {
      const q = await fetchQuote(currentSymbol);
      if (!q) return;
      // 更新顶部价格
      const priceEl = document.getElementById('current-price');
      const changeEl = document.getElementById('current-change');
      const changePctEl = document.getElementById('current-change-pct');
      if (priceEl) priceEl.textContent = fmtPrice(q.price);
      if (changeEl && changePctEl) {
        const sign = q.change >= 0 ? '+' : '';
        const cls = q.change >= 0 ? 'up' : 'down';
        changeEl.textContent = `${sign}${(q.price * q.change / 100).toFixed(2)}`;
        changeEl.className = cls;
        changePctEl.textContent = `(${sign}${q.change.toFixed(2)}%)`;
        changePctEl.className = cls;
      }
      updateSymbolPrice(currentSymbol.code, q);
      // 更新图表最后一根K线
      ChartManager.updateLastCandle(q.price);
    }, 5000); // 5秒刷新一次
  }

  // ===== Toolbar =====
  function bindToolbar() {
    // Chart type
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentChartType = btn.dataset.type;
        ChartManager.setChartType(currentChartType);
        // Re-add overlays
        activeIndicators.forEach(ind => {
          if (isOverlay(ind)) ChartManager.addOverlay(ind);
        });
      });
    });

    // Timeframe
    document.querySelectorAll('.tf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTf = btn.dataset.tf;
        loadSymbol(currentSymbol);
      });
    });
  }

  // ===== Indicator Menu =====
  function bindIndicatorMenu() {
    const btn = document.getElementById('indicator-menu-btn');
    const dropdown = document.getElementById('indicator-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.classList.add('hidden');
      }
    });

    dropdown.querySelectorAll('input[type=checkbox]').forEach(cb => {
      // Set initial state
      if (activeIndicators.has(cb.dataset.ind)) cb.checked = true;

      cb.addEventListener('change', () => {
        const name = cb.dataset.ind;
        if (cb.checked) {
          activeIndicators.add(name);
          if (isOverlay(name)) {
            ChartManager.addOverlay(name);
          } else {
            ChartManager.addIndicatorPanel(name);
          }
        } else {
          activeIndicators.delete(name);
          if (isOverlay(name)) {
            ChartManager.removeOverlay(name);
          } else {
            ChartManager.removeIndicatorPanel(name);
          }
        }
      });
    });
  }

  function isOverlay(name) {
    return ['MA5','MA10','MA20','MA60','MA120','MA250','EMA12','EMA26','BOLL','VWAP'].includes(name);
  }

  // ===== Sidebar =====
  function bindSidebar() {
    // Category tabs
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderSymbolList(btn.dataset.cat);
      });
    });

    // Search
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    function guessType(code) {
      const c = code.toUpperCase();
      const cryptoSymbols = ['BTC','ETH','SOL','BNB','XRP','DOGE','ADA','AVAX','DOT','LINK','UNI','LTC','XLM','XMR','TON','SHIB','PEPE','SUI','APT','ARB','OP','NEAR','ICP','FIL'];
      if (cryptoSymbols.some(s => c.startsWith(s)) || c.endsWith('USDT') || c.endsWith('USDC')) return 'crypto';
      if (c.endsWith('.HK')) return 'hk';
      if (c.endsWith('.SS') || c.endsWith('.SZ')) return 'cn';
      if (c.endsWith('=X')) return 'fx';
      if (c.endsWith('=F')) return 'metal';
      return 'us';
    }

    function selectSymbol(code, type) {
      const existing = ALL_SYMBOLS.find(s => s.code === code);
      const sym = existing || { code, name: code, type };
      // 加密货币需要 cgId
      if (sym.type === 'crypto' && !sym.cgId) sym.cgId = code.toLowerCase().replace('usdt','').replace('usdc','');
      loadSymbol(sym);
      searchInput.value = '';
      searchResults.classList.add('hidden');
      if (existing) {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === sym.type));
        renderSymbolList(sym.type);
      }
    }

    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const code = searchInput.value.trim().toUpperCase();
        if (!code) return;
        selectSymbol(code, guessType(code));
      }
    });

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) { searchResults.classList.add('hidden'); return; }
      const matches = ALL_SYMBOLS.filter(s =>
        s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      ).slice(0, 10);

      const rawCode = searchInput.value.trim().toUpperCase();
      const customItem = `
        <div class="search-item search-custom" data-code="${rawCode}" data-type="custom">
          <div class="s-code">${rawCode}</div>
          <div class="s-name">${i18n.t('searchDirect')} →</div>
        </div>`;

      searchResults.innerHTML = matches.map(s => `
        <div class="search-item" data-code="${s.code}" data-type="${s.type}">
          <div class="s-code">${s.code}</div>
          <div class="s-name">${s.name}</div>
        </div>`).join('') + customItem;

      searchResults.classList.remove('hidden');
      searchResults.querySelectorAll('.search-item').forEach(item => {
        item.addEventListener('click', () => {
          const code = item.dataset.code;
          const type = item.dataset.type === 'custom' ? guessType(code) : item.dataset.type;
          selectSymbol(code, type);
        });
      });
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => searchResults.classList.add('hidden'), 200);
    });
  }

  function renderSymbolList(cat) {
    const list = document.getElementById('symbol-list');
    const symbols = SYMBOLS[cat] || [];
    list.innerHTML = symbols.map(s => `
      <div class="symbol-item${s.code === currentSymbol.code ? ' active' : ''}" data-code="${s.code}">
        <div class="sym-left">
          <span class="sym-code">${s.code.replace('.HK','').replace('.SS','').replace('.SZ','').replace('=X','').replace('=F','')}</span>
          <span class="sym-name">${s.name}</span>
        </div>
        <div class="sym-right">
          <span class="sym-price" id="price-${s.code.replace(/[^a-zA-Z0-9]/g,'_')}">--</span>
          <span class="sym-chg neutral" id="chg-${s.code.replace(/[^a-zA-Z0-9]/g,'_')}">--</span>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.symbol-item').forEach(item => {
      item.addEventListener('click', () => {
        const sym = ALL_SYMBOLS.find(s => s.code === item.dataset.code);
        if (sym) loadSymbol(sym);
      });
    });

    // Fetch prices for visible symbols (throttled)
    symbols.forEach((s, i) => {
      setTimeout(() => fetchAndShowPrice(s), i * 300);
    });
  }

  async function fetchAndShowPrice(symbolObj) {
    const q = await fetchQuote(symbolObj);
    if (!q) return;
    updateSymbolPrice(symbolObj.code, q);
  }

  function updateSymbolPrice(code, q) {
    const safeId = code.replace(/[^a-zA-Z0-9]/g,'_');
    const priceEl = document.getElementById(`price-${safeId}`);
    const chgEl = document.getElementById(`chg-${safeId}`);
    if (priceEl) priceEl.textContent = fmtPrice(q.price);
    if (chgEl) {
      const sign = q.change >= 0 ? '+' : '';
      chgEl.textContent = `${sign}${q.change.toFixed(2)}%`;
      chgEl.className = `sym-chg ${q.change >= 0 ? 'up' : 'down'}`;
    }
  }

  function setActiveSymbolInList(code) {
    document.querySelectorAll('.symbol-item').forEach(item => {
      item.classList.toggle('active', item.dataset.code === code);
    });
    // Update header
    const sym = ALL_SYMBOLS.find(s => s.code === code);
    if (sym) {
      document.getElementById('current-symbol').textContent = sym.code;
      document.getElementById('current-name').textContent = sym.name;
    }
  }

  function updateSymbolHeader(symbolObj) {
    document.getElementById('current-symbol').textContent = symbolObj.code;
    document.getElementById('current-name').textContent = symbolObj.name;
    document.getElementById('current-price').textContent = '--';
    document.getElementById('current-change').textContent = '--';
    document.getElementById('current-change').className = 'neutral';
    document.getElementById('current-change-pct').textContent = '--';
    document.getElementById('current-change-pct').className = 'neutral';
  }

  function showLoading(show) {
    let overlay = document.getElementById('loading-overlay');
    if (show) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `<div class="spinner"></div><span>${i18n.t('loading')}</span>`;
        document.getElementById('chart-container').appendChild(overlay);
      }
    } else {
      if (overlay) overlay.remove();
    }
  }

  function fmtPrice(v) {
    if (!v && v !== 0) return '--';
    if (v >= 10000) return v.toFixed(0);
    if (v >= 100) return v.toFixed(2);
    if (v >= 1) return v.toFixed(3);
    return v.toFixed(5);
  }

  // ===== Trading Signal =====
  function updateSignal(data) {
    if (!data || data.length < 30) return;
    const signals = [];
    let score = 0;

    // RSI
    const rsi = Indicators.RSI(data, 14);
    const lastRsi = rsi[rsi.length - 1]?.value;
    if (lastRsi !== undefined) {
      if (lastRsi < 30) { signals.push({ label: `RSI ${lastRsi.toFixed(1)}`, hint: i18n.t('oversold'), type: 'buy' }); score += 2; }
      else if (lastRsi > 70) { signals.push({ label: `RSI ${lastRsi.toFixed(1)}`, hint: i18n.t('overbought'), type: 'sell' }); score -= 2; }
      else { signals.push({ label: `RSI ${lastRsi.toFixed(1)}`, hint: i18n.t('neutralHint'), type: 'neutral' }); }
    }

    // MACD
    const macd = Indicators.MACD(data);
    const mLen = macd.histogram.length;
    if (mLen >= 2) {
      const cur = macd.histogram[mLen - 1].value;
      const prev = macd.histogram[mLen - 2].value;
      if (cur > 0 && prev <= 0) { signals.push({ label: 'MACD', hint: i18n.t('goldenCross'), type: 'buy' }); score += 2; }
      else if (cur < 0 && prev >= 0) { signals.push({ label: 'MACD', hint: i18n.t('deathCross'), type: 'sell' }); score -= 2; }
      else if (cur > 0) { signals.push({ label: 'MACD', hint: i18n.t('bullish'), type: 'buy' }); score += 1; }
      else { signals.push({ label: 'MACD', hint: i18n.t('bearish'), type: 'sell' }); score -= 1; }
    }

    // MA20 vs MA60
    const ma20 = Indicators.MA(data, 20);
    const ma60 = Indicators.MA(data, 60);
    if (ma20.length && ma60.length) {
      const m20 = ma20[ma20.length - 1].value;
      const m60 = ma60[ma60.length - 1].value;
      if (m20 > m60) { signals.push({ label: 'MA20>MA60', hint: i18n.t('bullishAlign'), type: 'buy' }); score += 1; }
      else { signals.push({ label: 'MA20<MA60', hint: i18n.t('bearishAlign'), type: 'sell' }); score -= 1; }
    }

    // KDJ
    const kdj = Indicators.KDJ(data);
    const kLen = kdj.K.length;
    if (kLen >= 2) {
      const k = kdj.K[kLen - 1].value;
      const d = kdj.D[kLen - 1].value;
      const pk = kdj.K[kLen - 2].value;
      const pd = kdj.D[kLen - 2].value;
      if (k > d && pk <= pd) { signals.push({ label: 'KDJ', hint: i18n.t('goldenCross'), type: 'buy' }); score += 1; }
      else if (k < d && pk >= pd) { signals.push({ label: 'KDJ', hint: i18n.t('deathCross'), type: 'sell' }); score -= 1; }
      else { signals.push({ label: 'KDJ', hint: k > d ? i18n.t('bullish') : i18n.t('bearish'), type: k > d ? 'buy' : 'sell' }); }
    }

    // Render
    const scoreEl = document.getElementById('signal-score');
    const labelEl = document.getElementById('signal-label');
    const listEl = document.getElementById('signal-list');
    if (!scoreEl) return;

    const total = 6;
    const pct = Math.round(((score + total) / (total * 2)) * 100);
    scoreEl.textContent = score > 0 ? `+${score}` : score;
    scoreEl.className = score > 1 ? 'sig-buy' : score < -1 ? 'sig-sell' : 'sig-neutral';

    if (score >= 3) { labelEl.textContent = i18n.t('strongBuy'); labelEl.className = 'sig-buy'; }
    else if (score >= 1) { labelEl.textContent = i18n.t('buy'); labelEl.className = 'sig-buy'; }
    else if (score <= -3) { labelEl.textContent = i18n.t('strongSell'); labelEl.className = 'sig-sell'; }
    else if (score <= -1) { labelEl.textContent = i18n.t('sell'); labelEl.className = 'sig-sell'; }
    else { labelEl.textContent = i18n.t('neutral'); labelEl.className = 'sig-neutral'; }

    listEl.innerHTML = signals.map(s => `
      <div class="sig-item">
        <span class="sig-name">${s.label}</span>
        <span class="sig-hint ${s.type}">${s.hint}</span>
      </div>`).join('');
  }

  return { init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
