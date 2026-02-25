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
    priceUpdateTimer = setInterval(() => {
      fetchAndUpdateQuote(currentSymbol);
    }, 30000);
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

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) { searchResults.classList.add('hidden'); return; }
      const matches = ALL_SYMBOLS.filter(s =>
        s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      ).slice(0, 10);
      if (!matches.length) { searchResults.classList.add('hidden'); return; }
      searchResults.innerHTML = matches.map(s => `
        <div class="search-item" data-code="${s.code}">
          <div class="s-code">${s.code}</div>
          <div class="s-name">${s.name}</div>
        </div>
      `).join('');
      searchResults.classList.remove('hidden');
      searchResults.querySelectorAll('.search-item').forEach(item => {
        item.addEventListener('click', () => {
          const sym = ALL_SYMBOLS.find(s => s.code === item.dataset.code);
          if (sym) {
            loadSymbol(sym);
            searchInput.value = '';
            searchResults.classList.add('hidden');
            // Switch to correct category tab
            document.querySelectorAll('.cat-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.cat === sym.type);
            });
            renderSymbolList(sym.type);
          }
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
        overlay.innerHTML = '<div class="spinner"></div><span>加载中...</span>';
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

  return { init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
