// indicators.js - Technical indicator calculations

const Indicators = {

  // Simple Moving Average
  MA(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) { result.push(null); continue; }
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
      result.push({ time: data[i].time, value: sum / period });
    }
    return result.filter(x => x !== null);
  },

  // Exponential Moving Average
  EMA(data, period) {
    const result = [];
    const k = 2 / (period + 1);
    let ema = null;
    for (let i = 0; i < data.length; i++) {
      if (ema === null) {
        if (i < period - 1) continue;
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[j].close;
        ema = sum / period;
      } else {
        ema = data[i].close * k + ema * (1 - k);
      }
      result.push({ time: data[i].time, value: ema });
    }
    return result;
  },

  // Bollinger Bands
  BOLL(data, period = 20, multiplier = 2) {
    const upper = [], middle = [], lower = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
      const ma = sum / period;
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) variance += Math.pow(data[j].close - ma, 2);
      const std = Math.sqrt(variance / period);
      const t = data[i].time;
      upper.push({ time: t, value: ma + multiplier * std });
      middle.push({ time: t, value: ma });
      lower.push({ time: t, value: ma - multiplier * std });
    }
    return { upper, middle, lower };
  },

  // VWAP (Volume Weighted Average Price)
  VWAP(data) {
    const result = [];
    let cumPV = 0, cumV = 0;
    for (let i = 0; i < data.length; i++) {
      const typical = (data[i].high + data[i].low + data[i].close) / 3;
      const vol = data[i].volume || 1;
      cumPV += typical * vol;
      cumV += vol;
      result.push({ time: data[i].time, value: cumPV / cumV });
    }
    return result;
  },

  // MACD
  MACD(data, fast = 12, slow = 26, signal = 9) {
    const emaFast = this._emaRaw(data.map(d => d.close), fast);
    const emaSlow = this._emaRaw(data.map(d => d.close), slow);
    const macdLine = [], signalLine = [], histogram = [];
    const offset = slow - 1;
    const macdValues = [];
    for (let i = 0; i < emaSlow.length; i++) {
      macdValues.push(emaFast[i + (fast - slow)] - emaSlow[i]);
    }
    const sigEma = this._emaRaw(macdValues, signal);
    for (let i = signal - 1; i < macdValues.length; i++) {
      const idx = offset + i;
      if (idx >= data.length) break;
      const t = data[idx].time;
      const m = macdValues[i];
      const s = sigEma[i - (signal - 1)];
      macdLine.push({ time: t, value: m });
      signalLine.push({ time: t, value: s });
      histogram.push({ time: t, value: m - s, color: (m - s) >= 0 ? '#3fb95088' : '#f8514988' });
    }
    return { macdLine, signalLine, histogram };
  },

  // RSI
  RSI(data, period = 14) {
    const result = [];
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = data[i].close - data[i - 1].close;
      if (diff > 0) gains += diff; else losses -= diff;
    }
    let avgGain = gains / period, avgLoss = losses / period;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({ time: data[period].time, value: rsi });
    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i].close - data[i - 1].close;
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const r = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
      result.push({ time: data[i].time, value: r });
    }
    return result;
  },

  // KDJ
  KDJ(data, period = 9) {
    const K = [], D = [], J = [];
    let k = 50, d = 50;
    for (let i = period - 1; i < data.length; i++) {
      let highest = -Infinity, lowest = Infinity;
      for (let j = i - period + 1; j <= i; j++) {
        if (data[j].high > highest) highest = data[j].high;
        if (data[j].low < lowest) lowest = data[j].low;
      }
      const rsv = highest === lowest ? 50 : (data[i].close - lowest) / (highest - lowest) * 100;
      k = (2 / 3) * k + (1 / 3) * rsv;
      d = (2 / 3) * d + (1 / 3) * k;
      const j_ = 3 * k - 2 * d;
      const t = data[i].time;
      K.push({ time: t, value: k });
      D.push({ time: t, value: d });
      J.push({ time: t, value: j_ });
    }
    return { K, D, J };
  },

  // Volume
  VOL(data) {
    return data.map(d => ({
      time: d.time,
      value: d.volume || 0,
      color: d.close >= d.open ? '#3fb95066' : '#f8514966'
    }));
  },

  // OBV
  OBV(data) {
    const result = [];
    let obv = 0;
    result.push({ time: data[0].time, value: 0 });
    for (let i = 1; i < data.length; i++) {
      const vol = data[i].volume || 0;
      if (data[i].close > data[i - 1].close) obv += vol;
      else if (data[i].close < data[i - 1].close) obv -= vol;
      result.push({ time: data[i].time, value: obv });
    }
    return result;
  },

  // CCI
  CCI(data, period = 20) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      const typicals = [];
      for (let j = i - period + 1; j <= i; j++) {
        const tp = (data[j].high + data[j].low + data[j].close) / 3;
        typicals.push(tp);
        sum += tp;
      }
      const ma = sum / period;
      let meanDev = 0;
      for (const tp of typicals) meanDev += Math.abs(tp - ma);
      meanDev /= period;
      const tp = typicals[typicals.length - 1];
      const cci = meanDev === 0 ? 0 : (tp - ma) / (0.015 * meanDev);
      result.push({ time: data[i].time, value: cci });
    }
    return result;
  },

  // ATR
  ATR(data, period = 14) {
    const result = [];
    let atr = 0;
    for (let i = 1; i < data.length; i++) {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      if (i < period) { atr += tr; continue; }
      if (i === period) { atr = (atr + tr) / period; }
      else { atr = (atr * (period - 1) + tr) / period; }
      result.push({ time: data[i].time, value: atr });
    }
    return result;
  },

  // Williams %R
  WR(data, period = 14) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      let highest = -Infinity, lowest = Infinity;
      for (let j = i - period + 1; j <= i; j++) {
        if (data[j].high > highest) highest = data[j].high;
        if (data[j].low < lowest) lowest = data[j].low;
      }
      const wr = highest === lowest ? -50 : (highest - data[i].close) / (highest - lowest) * -100;
      result.push({ time: data[i].time, value: wr });
    }
    return result;
  },

  // Internal: raw EMA on array of numbers
  _emaRaw(values, period) {
    const result = [];
    const k = 2 / (period + 1);
    let ema = 0;
    for (let i = 0; i < period; i++) ema += values[i];
    ema /= period;
    result.push(ema);
    for (let i = period; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
      result.push(ema);
    }
    return result;
  }
};
