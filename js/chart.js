// chart.js - Chart rendering with lightweight-charts

const ChartManager = (() => {
  let mainChart = null;
  let mainSeries = null;
  let currentData = [];
  let currentChartType = 'candlestick';
  let overlaySeriesMap = {};
  let indicatorPanels = {}; // { name: { chart, series... } }
  const PANEL_HEIGHT = 120;

  const chartOptions = {
    layout: {
      background: { color: '#0d1117' },
      textColor: '#8b949e',
      fontSize: 11,
    },
    grid: {
      vertLines: { color: '#21262d' },
      horzLines: { color: '#21262d' },
    },
    crosshair: {
      mode: 1,
      vertLine: { color: '#58a6ff55', labelBackgroundColor: '#21262d' },
      horzLine: { color: '#58a6ff55', labelBackgroundColor: '#21262d' },
    },
    rightPriceScale: {
      borderColor: '#30363d',
      textColor: '#8b949e',
    },
    timeScale: {
      borderColor: '#30363d',
      textColor: '#8b949e',
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
  };

  function init() {
    const container = document.getElementById('chart-container');
    mainChart = LightweightCharts.createChart(container, {
      ...chartOptions,
      width: container.clientWidth,
      height: container.clientHeight,
    });

    mainSeries = mainChart.addCandlestickSeries({
      upColor: '#3fb950',
      downColor: '#f85149',
      borderUpColor: '#3fb950',
      borderDownColor: '#f85149',
      wickUpColor: '#3fb950',
      wickDownColor: '#f85149',
    });

    // Crosshair move → update status bar
    mainChart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData) return;
      const d = param.seriesData.get(mainSeries);
      if (!d) return;
      updateOHLCV(d);
    });

    // Resize observer
    const ro = new ResizeObserver(() => resizeAll());
    ro.observe(container);
  }

  function resizeAll() {
    const container = document.getElementById('chart-container');
    if (mainChart) mainChart.resize(container.clientWidth, container.clientHeight);
    Object.values(indicatorPanels).forEach(p => {
      if (p.chart && p.el) p.chart.resize(p.el.clientWidth, PANEL_HEIGHT);
    });
  }

  function setData(data) {
    currentData = data;
    if (!mainSeries) return;
    if (currentChartType === 'candlestick') {
      mainSeries.setData(data);
    } else {
      mainSeries.setData(data.map(d => ({ time: d.time, value: d.close })));
    }
    mainChart.timeScale().fitContent();
    // Refresh overlays
    Object.keys(overlaySeriesMap).forEach(name => {
      refreshOverlay(name);
    });
    // Refresh indicator panels
    Object.keys(indicatorPanels).forEach(name => {
      refreshPanel(name);
    });
  }

  function setChartType(type) {
    currentChartType = type;
    if (!mainChart) return;
    // Remove old series
    if (mainSeries) mainChart.removeSeries(mainSeries);
    overlaySeriesMap = {};

    if (type === 'candlestick') {
      mainSeries = mainChart.addCandlestickSeries({
        upColor: '#3fb950', downColor: '#f85149',
        borderUpColor: '#3fb950', borderDownColor: '#f85149',
        wickUpColor: '#3fb950', wickDownColor: '#f85149',
      });
    } else if (type === 'line') {
      mainSeries = mainChart.addLineSeries({ color: '#58a6ff', lineWidth: 2 });
    } else if (type === 'area') {
      mainSeries = mainChart.addAreaSeries({
        lineColor: '#58a6ff', topColor: '#58a6ff44', bottomColor: '#58a6ff00', lineWidth: 2,
      });
    }

    mainChart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData) return;
      const d = param.seriesData.get(mainSeries);
      if (!d) return;
      updateOHLCV(d);
    });

    if (currentData.length) setData(currentData);
  }

  // ===== Overlay Indicators =====
  const overlayColors = {
    MA5: '#f0c040', MA10: '#e8834a', MA20: '#58a6ff', MA60: '#bc8cff',
    MA120: '#3fb950', MA250: '#f85149', EMA12: '#ffa657', EMA26: '#39d353',
    BOLL_upper: '#58a6ff88', BOLL_mid: '#58a6ff', BOLL_lower: '#58a6ff88',
    VWAP: '#ff79c6',
  };

  function addOverlay(name) {
    if (!currentData.length || overlaySeriesMap[name]) return;
    if (name.startsWith('MA')) {
      const period = parseInt(name.slice(2));
      const maData = Indicators.MA(currentData, period);
      const s = mainChart.addLineSeries({ color: overlayColors[name] || '#fff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(maData);
      overlaySeriesMap[name] = [s];
    } else if (name.startsWith('EMA')) {
      const period = parseInt(name.slice(3));
      const emaData = Indicators.EMA(currentData, period);
      const s = mainChart.addLineSeries({ color: overlayColors[name] || '#ffa657', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(emaData);
      overlaySeriesMap[name] = [s];
    } else if (name === 'BOLL') {
      const { upper, middle, lower } = Indicators.BOLL(currentData);
      const su = mainChart.addLineSeries({ color: overlayColors.BOLL_upper, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const sm = mainChart.addLineSeries({ color: overlayColors.BOLL_mid, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const sl = mainChart.addLineSeries({ color: overlayColors.BOLL_lower, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      su.setData(upper); sm.setData(middle); sl.setData(lower);
      overlaySeriesMap[name] = [su, sm, sl];
    } else if (name === 'VWAP') {
      const vwapData = Indicators.VWAP(currentData);
      const s = mainChart.addLineSeries({ color: overlayColors.VWAP, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      s.setData(vwapData);
      overlaySeriesMap[name] = [s];
    }
  }

  function removeOverlay(name) {
    if (!overlaySeriesMap[name]) return;
    overlaySeriesMap[name].forEach(s => mainChart.removeSeries(s));
    delete overlaySeriesMap[name];
  }

  function refreshOverlay(name) {
    if (!overlaySeriesMap[name]) return;
    removeOverlay(name);
    addOverlay(name);
  }

  // ===== Sub-chart Indicator Panels =====
  function addIndicatorPanel(name) {
    if (indicatorPanels[name]) return;
    const panelsEl = document.getElementById('indicator-panels');
    const el = document.createElement('div');
    el.className = 'indicator-panel';
    el.style.height = PANEL_HEIGHT + 'px';
    el.dataset.ind = name;

    const header = document.createElement('div');
    header.className = 'indicator-panel-header';
    header.innerHTML = `<span>${name}</span><button class="indicator-panel-close" data-ind="${name}">✕</button>`;
    el.appendChild(header);

    const chartEl = document.createElement('div');
    chartEl.style.width = '100%';
    chartEl.style.height = '100%';
    el.appendChild(chartEl);
    panelsEl.appendChild(el);

    const chart = LightweightCharts.createChart(chartEl, {
      ...chartOptions,
      width: chartEl.clientWidth,
      height: PANEL_HEIGHT,
      timeScale: { ...chartOptions.timeScale, visible: false },
      rightPriceScale: { ...chartOptions.rightPriceScale, scaleMargins: { top: 0.1, bottom: 0.1 } },
    });

    // Sync time scale
    mainChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (range) chart.timeScale().setVisibleLogicalRange(range);
    });
    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (range) mainChart.timeScale().setVisibleLogicalRange(range);
    });

    indicatorPanels[name] = { chart, el, series: {} };
    refreshPanel(name);

    // Close button
    header.querySelector('.indicator-panel-close').addEventListener('click', () => {
      removeIndicatorPanel(name);
      const cb = document.querySelector(`input[data-ind="${name}"]`);
      if (cb) cb.checked = false;
    });

    // Resize
    new ResizeObserver(() => {
      chart.resize(chartEl.clientWidth, PANEL_HEIGHT);
    }).observe(chartEl);
  }

  function removeIndicatorPanel(name) {
    if (!indicatorPanels[name]) return;
    indicatorPanels[name].chart.remove();
    indicatorPanels[name].el.remove();
    delete indicatorPanels[name];
  }

  function refreshPanel(name) {
    const p = indicatorPanels[name];
    if (!p || !currentData.length) return;
    // Remove old series
    Object.values(p.series).forEach(s => { try { p.chart.removeSeries(s); } catch(e){} });
    p.series = {};

    if (name === 'VOL') {
      const s = p.chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'right' });
      s.setData(Indicators.VOL(currentData));
      p.series.vol = s;
    } else if (name === 'MACD') {
      const { macdLine, signalLine, histogram } = Indicators.MACD(currentData);
      const sh = p.chart.addHistogramSeries({ color: '#3fb950', priceLineVisible: false, lastValueVisible: false });
      const sm = p.chart.addLineSeries({ color: '#f0c040', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const sd = p.chart.addLineSeries({ color: '#58a6ff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      sh.setData(histogram); sm.setData(macdLine); sd.setData(signalLine);
      p.series = { sh, sm, sd };
    } else if (name.startsWith('RSI')) {
      const period = parseInt(name.slice(3)) || 14;
      const rsiData = Indicators.RSI(currentData, period);
      const s = p.chart.addLineSeries({ color: '#bc8cff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(rsiData);
      // Overbought/oversold lines
      const ob = p.chart.addLineSeries({ color: '#f8514944', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      const os = p.chart.addLineSeries({ color: '#3fb95044', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      if (rsiData.length) {
        ob.setData([{ time: rsiData[0].time, value: 70 }, { time: rsiData[rsiData.length-1].time, value: 70 }]);
        os.setData([{ time: rsiData[0].time, value: 30 }, { time: rsiData[rsiData.length-1].time, value: 30 }]);
      }
      p.series = { s, ob, os };
    } else if (name === 'KDJ') {
      const { K, D, J } = Indicators.KDJ(currentData);
      const sk = p.chart.addLineSeries({ color: '#f0c040', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const sd = p.chart.addLineSeries({ color: '#58a6ff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const sj = p.chart.addLineSeries({ color: '#f85149', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      sk.setData(K); sd.setData(D); sj.setData(J);
      p.series = { sk, sd, sj };
    } else if (name === 'OBV') {
      const s = p.chart.addLineSeries({ color: '#39d353', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(Indicators.OBV(currentData));
      p.series.s = s;
    } else if (name === 'CCI') {
      const s = p.chart.addLineSeries({ color: '#ffa657', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(Indicators.CCI(currentData));
      p.series.s = s;
    } else if (name === 'ATR') {
      const s = p.chart.addLineSeries({ color: '#ff79c6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(Indicators.ATR(currentData));
      p.series.s = s;
    } else if (name === 'WR') {
      const s = p.chart.addLineSeries({ color: '#58a6ff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(Indicators.WR(currentData));
      p.series.s = s;
    }
  }

  function updateOHLCV(d) {
    const el = document.getElementById('ohlcv-info');
    if (!el) return;
    if (d.open !== undefined) {
      const isUp = d.close >= d.open;
      el.innerHTML = `
        <span><span class="lbl">O</span> <span class="${isUp?'val-up':'val-down'}">${fmt(d.open)}</span></span>
        <span><span class="lbl">H</span> <span class="${isUp?'val-up':'val-down'}">${fmt(d.high)}</span></span>
        <span><span class="lbl">L</span> <span class="${isUp?'val-up':'val-down'}">${fmt(d.low)}</span></span>
        <span><span class="lbl">C</span> <span class="${isUp?'val-up':'val-down'}">${fmt(d.close)}</span></span>
        <span><span class="lbl">V</span> <span>${fmtVol(d.volume||0)}</span></span>
      `;
    } else if (d.value !== undefined) {
      el.innerHTML = `<span><span class="lbl">价格</span> <span>${fmt(d.value)}</span></span>`;
    }
  }

  function fmt(v) {
    if (!v && v !== 0) return '--';
    return v >= 1000 ? v.toFixed(2) : v >= 1 ? v.toFixed(3) : v.toFixed(5);
  }

  function fmtVol(v) {
    if (v >= 1e9) return (v/1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v/1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v/1e3).toFixed(1) + 'K';
    return v.toString();
  }

  function updateLastCandle(price) {
    if (!mainSeries || !currentData.length) return;
    const last = currentData[currentData.length - 1];
    const updated = {
      time: last.time,
      open: last.open,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      close: price,
      volume: last.volume,
    };
    currentData[currentData.length - 1] = updated;
    mainSeries.update(updated);
  }

  return { init, setData, setChartType, addOverlay, removeOverlay, addIndicatorPanel, removeIndicatorPanel, resizeAll, updateLastCandle };
})();
