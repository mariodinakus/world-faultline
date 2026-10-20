/*
 * WORLD FAULTLINE · US recession early-warning model (fitting + backtest)
 * ----------------------------------------------------------------------
 * Ridge-penalised logistic regression, fitted on NBER recession dates (FRED USREC).
 * Target: y_t = 1 if a recession month occurs in t+1..t+H (H = 12), sampled only in
 * expansion months (rec_t = 0) so the model predicts onsets, not ongoing recessions.
 *
 * Runs in a browser on fred.stlouisfed.org (same-origin fredgraph.csv) or in Node 18+
 * (global fetch). Usage in Node:  node research/fit_us_recession.js
 *
 * Evaluation (honest by construction):
 *   1. Expanding-window pseudo out-of-sample from 1985: the model used at month t is
 *      fitted only on samples whose 12-month label window had closed before t.
 *   2. Leave-one-recession-cycle-out cross-validation.
 * Caveat: FRED series are revised (not real-time vintages); only 7 recession onsets
 * exist in 1972-2024, so coefficients carry wide uncertainty.
 */
(function (root) {
  'use strict';
  const H = 12;
  const FEATURES = {
    spread: 'GS10 − TB3MS term spread (pp)',
    spreadMin24: 'Minimum term spread over last 24m (pp)',
    baa: 'Moody’s Baa − 10Y credit spread (pp)',
    nfci: 'Chicago Fed NFCI (financial conditions)',
    sahm: 'Real-time Sahm rule (pp, lagged 1m)',
    pay: 'Nonfarm payrolls y/y % (lagged 1m)',
    ff12: '12m change in fed funds rate (pp)',
    permit: 'Building permits y/y % (lagged 1m)'
  };
  const MODELS = {
    M0_spread: ['spread'],
    M1_curve_credit: ['spread', 'spreadMin24', 'baa', 'nfci'],
    M2_full: ['spread', 'spreadMin24', 'baa', 'nfci', 'sahm', 'pay', 'ff12', 'permit'],
    M3_parsimonious: ['spreadMin24', 'spread', 'nfci', 'sahm', 'ff12']
  };

  function buildFeatures(d) {
    const n = d.n, f = {};
    const lag = (a, k) => a.map((_, i) => (i - k >= 0 ? a[i - k] : null));
    f.spread = d.spread;
    f.spreadMin24 = d.spread.map((_, i) => {
      if (i < 23) return null;
      let m = Infinity;
      for (let k = i - 23; k <= i; k++) { if (d.spread[k] == null) return null; m = Math.min(m, d.spread[k]); }
      return m;
    });
    f.baa = d.baa; f.nfci = d.nfci; f.ff12 = d.ff12;
    f.sahm = lag(d.sahm, 1); f.pay = lag(d.pay, 1); f.permit = lag(d.permit, 1);
    const y = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      if (d.rec[i] !== 0) continue;
      let any = 0, known = true;
      for (let k = 1; k <= H; k++) { const r = d.rec[i + k]; if (r == null) { known = false; break; } if (r === 1) any = 1; }
      if (known) y[i] = any;
    }
    return { f, y };
  }

  function solve(A, b) { // Gaussian elimination with partial pivoting
    const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  }

  function fitLogit(X, y, lambda) { // X: rows of standardized features (no intercept)
    const p = X[0].length + 1; let b = new Array(p).fill(0);
    for (let it = 0; it < 60; it++) {
      const g = new Array(p).fill(0), Hm = Array.from({ length: p }, () => new Array(p).fill(0));
      for (let i = 0; i < X.length; i++) {
        const x = [1].concat(X[i]); let z = 0; for (let j = 0; j < p; j++) z += b[j] * x[j];
        const mu = 1 / (1 + Math.exp(-z)), w = mu * (1 - mu);
        for (let j = 0; j < p; j++) { g[j] += (y[i] - mu) * x[j]; for (let k = 0; k < p; k++) Hm[j][k] += w * x[j] * x[k]; }
      }
      for (let j = 1; j < p; j++) { g[j] -= lambda * b[j]; Hm[j][j] += lambda; }
      const step = solve(Hm, g); b = b.map((v, j) => v + step[j]);
      if (Math.max(...step.map(Math.abs)) < 1e-8) break;
    }
    return b;
  }

  function standardizer(rows) {
    const k = rows[0].length, mean = new Array(k).fill(0), sd = new Array(k).fill(0);
    rows.forEach(r => r.forEach((v, j) => mean[j] += v / rows.length));
    rows.forEach(r => r.forEach((v, j) => sd[j] += (v - mean[j]) ** 2 / rows.length));
    return { mean, sd: sd.map(Math.sqrt) };
  }

  function fitModel(feat, y, idx, vars, lambda) {
    const raw = idx.map(i => vars.map(v => feat[v][i]));
    const st = standardizer(raw);
    const X = raw.map(r => r.map((v, j) => (v - st.mean[j]) / st.sd[j]));
    const b = fitLogit(X, idx.map(i => y[i]), lambda);
    return { vars, mean: st.mean, sd: st.sd, beta: b, lambda };
  }

  function predict(m, feat, i) {
    let z = m.beta[0];
    for (let j = 0; j < m.vars.length; j++) { const v = feat[m.vars[j]][i]; if (v == null) return null; z += m.beta[j + 1] * (v - m.mean[j]) / m.sd[j]; }
    return 1 / (1 + Math.exp(-z));
  }

  function auc(p, y) {
    const pos = [], neg = []; p.forEach((v, i) => (y[i] ? pos : neg).push(v));
    let s = 0; for (const a of pos) for (const b of neg) s += a > b ? 1 : a === b ? 0.5 : 0;
    return s / (pos.length * neg.length);
  }
  const brier = (p, y) => p.reduce((s, v, i) => s + (v - y[i]) ** 2, 0) / p.length;
  const logloss = (p, y) => -p.reduce((s, v, i) => s + (y[i] ? Math.log(Math.max(v, 1e-6)) : Math.log(Math.max(1 - v, 1e-6))), 0) / p.length;

  function evaluate(d, opts) {
    opts = opts || {};
    const start = opts.start ?? (1972 - 1959) * 12;           // 1972-01
    const oosStart = opts.oosStart ?? (1985 - 1959) * 12;     // 1985-01
    const lastTrain = opts.lastTrain ?? d.n - 1 - 24;         // conservative: NBER dating lag
    const { f, y } = buildFeatures(d);
    const usable = vars => { const out = []; for (let i = start; i <= lastTrain; i++) if (y[i] != null && vars.every(v => f[v][i] != null)) out.push(i); return out; };
    const results = {};
    for (const [name, vars] of Object.entries(MODELS)) {
      for (const lambda of (opts.lambdas || [0.5, 2, 8])) {
        const all = usable(vars);
        // 1) expanding window, refit every 12 months
        const P = [], Y = []; let m = null;
        for (const t of all.filter(i => i >= oosStart)) {
          if (!m || (t - oosStart) % 12 === 0) {
            const tr = all.filter(i => i + H < t);
            m = fitModel(f, y, tr, vars, lambda);
          }
          P.push(predict(m, f, t)); Y.push(y[t]);
        }
        // 2) leave-one-cycle-out (cycle = expansion months preceding each recession + that recession)
        const cyc = new Array(d.n).fill(0); let c = 0;
        for (let i = 1; i < d.n; i++) { if (d.rec[i - 1] === 1 && d.rec[i] === 0) c++; cyc[i] = c; }
        const P2 = [], Y2 = [];
        for (const k of [...new Set(all.map(i => cyc[i]))]) {
          const te = all.filter(i => cyc[i] === k), tr = all.filter(i => cyc[i] !== k);
          const mm = fitModel(f, y, tr, vars, lambda); te.forEach(i => { P2.push(predict(mm, f, i)); Y2.push(y[i]); });
        }
        const base = Y.reduce((a, b) => a + b, 0) / Y.length;
        results[name + '@' + lambda] = {
          vars, lambda, n: all.length,
          oos: { auc: auc(P, Y), brier: brier(P, Y), logloss: logloss(P, Y), base, brierBase: brier(P.map(() => base), Y), n: P.length },
          loco: { auc: auc(P2, Y2), brier: brier(P2, Y2), logloss: logloss(P2, Y2) }
        };
      }
    }
    return { results, f, y, usable };
  }

  function finalFit(d, vars, lambda, opts) {
    opts = opts || {};
    const start = opts.start ?? (1972 - 1959) * 12, lastTrain = opts.lastTrain ?? d.n - 1 - 24;
    const { f, y } = buildFeatures(d);
    const idx = []; for (let i = start; i <= lastTrain; i++) if (y[i] != null && vars.every(v => f[v][i] != null)) idx.push(i);
    const m = fitModel(f, y, idx, vars, lambda);
    const inSample = idx.map(i => predict(m, f, i));
    return { model: m, n: idx.length, positives: idx.filter(i => y[i]).length, auc: auc(inSample, idx.map(i => y[i])), f, y };
  }

  const api = { H, FEATURES, MODELS, buildFeatures, fitModel, predict, evaluate, finalFit, auc, brier };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FaultlineFit = api;
})(typeof window !== 'undefined' ? window : globalThis);
