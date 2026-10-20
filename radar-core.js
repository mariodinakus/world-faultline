/*
 * WORLD FAULTLINE · RECESSION & CRISIS RADAR — computation core (v1.0)
 * --------------------------------------------------------------------
 * Shared by the Vercel function (api/radar.js) and by research/browser tests.
 * Pulls live public data (FRED, OECD, ECB, Eurostat), then computes:
 *   1. US 12-month recession probability — fitted, backtested logistic model
 *   2. Financial-stress "GFC-equivalence" (% of the 2008 peak, US + euro area)
 *   3. Global cycle: G20 composite leading indicator + GDP-weighted downturn diffusion
 *   4. Country recession-signal scores (rule-based, transparent thresholds)
 *   5. Historical analog finder and a rule-based regime verdict
 * No value is imputed: missing sources propagate as null and are reported.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FaultlineRadarCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 1. Fitted model (research/fit_us_recession.js, model A, λ = 32)      */
  /* ------------------------------------------------------------------ */
  const MODEL = {
    id: 'US-REC-12M-A32',
    fitted: '2026-10-20',
    target: 'NBER recession begins within the next 12 months (sampled in expansion months)',
    vars: ['spread', 'spreadMin24', 'nfci'],
    labels: {
      spread: '10Y − 3M Treasury term spread (GS10 − TB3MS)',
      spreadMin24: 'Lowest term spread of the last 24 months (memory of inversion)',
      nfci: 'Chicago Fed National Financial Conditions Index'
    },
    beta: [-2.208918, -0.729274, -0.384213, 0.560609],
    mean: [1.562964, 0.653571, -0.227214],
    sd: [1.305601, 1.182468, 0.677208],
    lambda: 32,
    sample: { from: '1972-01', to: '2024-10', months: 560, positives: 84, onsets: 7 },
    backtest: {
      method: 'Expanding window from 1985-01, refit every 12 months, labels only once their 12-month window had closed',
      oosAuc: 0.9021, oosBrier: 0.0977, brierClimatology: 0.1086,
      locoAuc: 0.9131, locoBrier: 0.1004,
      calibration: [ // [lo, hi, months, realised frequency, mean predicted]
        [0, 0.10, 199, 0.00, 0.05], [0.10, 0.25, 164, 0.09, 0.16], [0.25, 0.50, 56, 0.61, 0.30], [0.50, 1.00, 23, 0.00, 0.71]
      ],
      note: 'All 23 out-of-sample months above 50% are the 2022–24 inverted-curve episode, which was not followed by an NBER recession. The model ranks risk well but is poorly calibrated at the top end.'
    },
    oosStart: '1985-01',
    oos: [8,9.1,9,8.5,8.5,8.8,9,9.6,9.6,10,11.6,13.4,12,15.2,18.4,18,15.7,15.6,16.2,14.8,11.9,12,13.5,15.2,14,14.1,15,13.7,13.2,14.1,12.3,11.6,11.7,12.9,15.2,14,12,11.7,10.8,10.1,10.3,11.9,12.8,13.6,15.4,16.8,18.8,20.3,21.3,24.7,29,29.8,28.9,31.4,30.8,30,29,29.8,29.9,28.3,23.8,22.6,22.9,20.8,20.3,21,20.2,null,null,null,null,null,null,null,null,10.6,9.6,9.1,8.7,8.6,8.9,8.4,7.1,6,6.8,6,5.8,5.1,4.9,5,4.3,4.7,4.7,4.4,4.4,4,3.4,3.6,4,3.7,3.8,4.1,4.3,4.5,5.2,5.7,5,4.7,4.3,4.5,4.2,3.7,4.3,4.4,4.4,4.7,4.6,5,5.5,7.4,8,10,11.6,12.1,16.4,19.6,18.4,16.4,17.7,19,21,20.9,19.7,16.7,14.6,13.3,12.2,11.7,12.3,12.9,12,13.2,15.5,14.2,12.1,12.7,12,11.3,11.8,12.4,14.7,14.8,14.2,16.1,19.2,19.5,19.7,19.4,18.2,17.8,18.4,19.6,20,21.9,28.1,25.6,26.6,27.4,24,21.5,18.8,17.7,16.6,14.8,16.2,17,17.3,17.4,19.3,18.2,14.5,17.1,21,24,21.6,24,26.9,31.9,30.8,33.8,36,38.5,28.9,25.5,23.2,null,null,null,null,null,null,null,null,5.7,6,6.5,5.4,5.3,5.3,6,7.4,9.2,11.6,10.9,8.2,6.7,6.2,6.1,4.7,3.6,4.3,4.5,3,2,2.1,2,2,2,2,2.1,2.5,1.8,1.6,1.9,2.2,2.8,3.2,3.5,4.3,4.7,5.2,6.7,6.3,7.4,9.5,12.1,12.8,14.5,15.2,15.6,16.8,18.1,24.3,24.6,23.7,21.8,22,23.4,25.5,29.3,29.4,31.2,34.4,33.8,31.2,32.3,34.3,31.9,29.6,23.9,29.4,31.1,30.5,28.4,28.7,29.2,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,6.6,5.2,5.3,4.4,4,3.4,2.4,2,1.9,1.7,2.5,3.1,3.3,3.5,3.5,3.5,3,2.1,1.8,1.6,1.7,1.6,1.9,2.2,2.3,4.2,6.4,5.8,6.2,6.3,5.9,5.8,5,5.4,7.2,8.9,9.4,8.2,7.7,7.3,7.7,7.2,6.1,5.9,5.9,6.4,5.6,4.7,3.9,3.5,3.3,3.7,3.4,3,2.8,3.1,3.1,3.1,3.4,3.3,3.3,3.7,3.4,4.1,3.9,4.2,5.3,5,4.7,4.7,3.9,3.6,3.7,4.4,4.4,4.6,4.3,4.8,5.5,8.3,7.4,7.4,7.5,8.9,10.7,10.2,9.8,9.2,7.6,6.1,6.1,6.1,6.8,7.9,8.2,9.2,8.9,9.2,9.5,8.7,9.8,10.2,9.3,8.8,10,10.2,9.9,11,11.9,12.6,12.4,12.4,14.2,20.5,22,22.1,24.2,24.5,27.1,31.1,30.1,37.5,35.9,31.6,27.8,27.4,27.1,33.1,null,null,29.4,25.8,25.7,24.2,23.9,22.5,20.8,19.6,21.2,18.4,14.4,13.8,13.8,15,17.4,17,14.7,12.9,13.5,14.6,12.4,10.2,10,8.2,9,11.4,21.2,29.6,28.6,31.3,46.9,58.5,68.4,66.2,70.2,80.8,82.6,80.6,79.5,75.8,72.7,66.5,70.3,76.7,73.7,71.3,71,65.6,66.9,69.9,70.5,74.1,70.8,60]
  };

  /* Approximate 2024 nominal GDP (USD tn, IMF WEO / World Bank) — fixed weights so history is comparable */
  const CLI_WEIGHTS = { USA: 29.2, CHN: 18.7, DEU: 4.7, JPN: 4.0, IND: 3.9, GBR: 3.6, FRA: 3.2, ITA: 2.4, BRA: 2.2, CAN: 2.2, MEX: 1.85, KOR: 1.87, ESP: 1.73, AUS: 1.8, IDN: 1.4, TUR: 1.3, ZAF: 0.4 };

  const EPISODES = [
    { id: 'oil74', name: '1973–75 oil shock', from: '1973-11', to: '1975-06', type: 'Global recession · supply shock', global: true, systemic: false },
    { id: 'volcker', name: '1980–82 Volcker double-dip', from: '1980-01', to: '1982-12', type: 'Global recession · monetary tightening', global: true, systemic: false },
    { id: 'sl91', name: '1990–91 S&L / Gulf war', from: '1990-06', to: '1991-06', type: 'Global recession · banking + oil', global: true, systemic: false },
    { id: 'ltcm', name: '1998 Asia / LTCM', from: '1998-06', to: '1998-12', type: 'Regional EM crisis, no US recession', global: false, systemic: false },
    { id: 'dotcom', name: '2001 dot-com', from: '2000-09', to: '2002-10', type: 'Mild US/advanced recession', global: false, systemic: false },
    { id: 'pregfc', name: '2006–07 pre-GFC', from: '2006-06', to: '2007-07', type: 'Late cycle: inverted curve, low stress', global: false, systemic: false },
    { id: 'gfc', name: '2008 Global Financial Crisis', from: '2007-08', to: '2009-06', type: 'Systemic banking crisis + global recession', global: true, systemic: true },
    { id: 'euro', name: '2011–12 euro crisis', from: '2011-06', to: '2012-08', type: 'Regional sovereign–bank crisis (EA recession)', global: false, systemic: true },
    { id: 'china16', name: '2015–16 China / EM / oil', from: '2015-08', to: '2016-03', type: 'Global slowdown, no global recession', global: false, systemic: false },
    { id: 'trade19', name: '2019 trade war', from: '2018-10', to: '2019-10', type: 'Manufacturing slowdown, inverted curve', global: false, systemic: false },
    { id: 'covid', name: '2020 COVID shock', from: '2020-02', to: '2020-06', type: 'Global recession · exogenous shock', global: true, systemic: false },
    { id: 'infl22', name: '2022 inflation shock', from: '2022-01', to: '2022-12', type: 'Rate shock, EA energy crisis', global: false, systemic: false },
    { id: 'inv23', name: '2023–24 inversion, no recession', from: '2023-03', to: '2024-06', type: 'False alarm: deep inversion, soft landing', global: false, systemic: false }
  ];

  const COUNTRIES = {
    USA: ['United States', 'US', 'Americas'], CAN: ['Canada', 'CA', 'Americas'], MEX: ['Mexico', 'MX', 'Americas'], BRA: ['Brazil', 'BR', 'Americas'],
    GBR: ['United Kingdom', 'GB', 'Europe'], DEU: ['Germany', 'DE', 'Euro area'], FRA: ['France', 'FR', 'Euro area'], ITA: ['Italy', 'IT', 'Euro area'],
    ESP: ['Spain', 'ES', 'Euro area'], NLD: ['Netherlands', 'NL', 'Euro area'], BEL: ['Belgium', 'BE', 'Euro area'], AUT: ['Austria', 'AT', 'Euro area'],
    PRT: ['Portugal', 'PT', 'Euro area'], GRC: ['Greece', 'EL', 'Euro area'], IRL: ['Ireland', 'IE', 'Euro area'], FIN: ['Finland', 'FI', 'Euro area'],
    SVK: ['Slovakia', 'SK', 'Euro area'], SVN: ['Slovenia', 'SI', 'Euro area'], LTU: ['Lithuania', 'LT', 'Euro area'], LVA: ['Latvia', 'LV', 'Euro area'],
    EST: ['Estonia', 'EE', 'Euro area'], HRV: ['Croatia', 'HR', 'Euro area'], CYP: ['Cyprus', 'CY', 'Euro area'], LUX: ['Luxembourg', 'LU', 'Euro area'],
    MLT: ['Malta', 'MT', 'Euro area'], BGR: ['Bulgaria', 'BG', 'Euro area'], POL: ['Poland', 'PL', 'Europe'], CZE: ['Czechia', 'CZ', 'Europe'],
    HUN: ['Hungary', 'HU', 'Europe'], ROU: ['Romania', 'RO', 'Europe'], SWE: ['Sweden', 'SE', 'Europe'], DNK: ['Denmark', 'DK', 'Europe'],
    TUR: ['Türkiye', 'TR', 'Europe'], SRB: ['Serbia', 'RS', 'Europe'], MKD: ['North Macedonia', 'MK', 'Europe'], ALB: ['Albania', 'AL', 'Europe'],
    MNE: ['Montenegro', 'ME', 'Europe'], NOR: ['Norway', 'NO', 'Europe'], CHE: ['Switzerland', 'CH', 'Europe'],
    CHN: ['China', 'CN', 'Asia-Pacific'], JPN: ['Japan', 'JP', 'Asia-Pacific'], KOR: ['Korea, Rep.', 'KR', 'Asia-Pacific'], IND: ['India', 'IN', 'Asia-Pacific'],
    IDN: ['Indonesia', 'ID', 'Asia-Pacific'], AUS: ['Australia', 'AU', 'Asia-Pacific'], ZAF: ['South Africa', 'ZA', 'Africa']
  };
  const ISO2_TO_3 = {}; Object.entries(COUNTRIES).forEach(([k, v]) => { ISO2_TO_3[v[1]] = k; }); ISO2_TO_3.GR = 'GRC'; ISO2_TO_3.UK = 'GBR';

  /* ------------------------------------------------------------------ */
  /* Helpers                                                              */
  /* ------------------------------------------------------------------ */
  const FRED = 'https://fred.stlouisfed.org/graph/fredgraph.csv';
  const OECD = 'https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,/';
  const ECB = 'https://data-api.ecb.europa.eu/service/data/';
  const ESTAT = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/';

  const mkey = d => d.slice(0, 7);
  const addMonths = (k, n) => { let [y, m] = k.split('-').map(Number); m += n; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return y + '-' + String(m).padStart(2, '0'); };
  const monthRange = (a, b) => { const out = []; for (let k = a; k <= b; k = addMonths(k, 1)) out.push(k); return out; };
  const isoDate = d => d.toISOString().slice(0, 10);
  const r2 = (x, n = 2) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10 ** n) / 10 ** n);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const median = a => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); if (!s.length) return null; const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
  const mean = a => { const s = a.filter(Number.isFinite); return s.length ? s.reduce((x, y) => x + y, 0) / s.length : null; };
  const sdev = a => { const s = a.filter(Number.isFinite); const m = mean(s); return s.length > 1 ? Math.sqrt(s.reduce((x, y) => x + (y - m) ** 2, 0) / (s.length - 1)) : null; };
  const lastValid = arr => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i] && Number.isFinite(arr[i].v)) return arr[i]; return null; };
  function splitCsvLine(l) { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; } else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; }
  function parseCsv(text) { const L = text.replace(/\r/g, '').trim().split('\n'); const h = splitCsvLine(L[0]); return L.slice(1).filter(Boolean).map(l => { const c = splitCsvLine(l); const o = {}; h.forEach((k, i) => { o[k] = c[i]; }); return o; }); }
  async function pool(tasks, n) { const out = new Array(tasks.length); let i = 0; await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, async () => { while (i < tasks.length) { const k = i++; try { out[k] = { ok: true, value: await tasks[k]() }; } catch (e) { out[k] = { ok: false, error: String(e && e.message || e) }; } } })); return out; }

  /* ------------------------------------------------------------------ */
  /* Source adapters                                                      */
  /* ------------------------------------------------------------------ */
  function parseFred(text, id) {
    if (!/^observation_date|^DATE/i.test(text.trim())) throw new Error('FRED ' + id + ': unexpected response');
    return text.replace(/\r/g, '').trim().split('\n').slice(1).map(l => { const [d, v] = l.split(','); const x = parseFloat(v); return { d, v: Number.isFinite(x) ? x : null }; }).filter(o => o.v != null);
  }
  const FRED_MONTHLY = ['GS10', 'TB3MS', 'NFCI', 'BAA10YM', 'USREC', 'SAHMREALTIME', 'UNRATE', 'PAYEMS', 'INDPRO', 'PERMIT', 'UMCSENT', 'ICSA', 'VIXCLS', 'STLFSI4', 'DCOILBRENTEU', 'T10Y2Y'];
  const FRED_RAW = ['DRTSCILM'];
  const FRED_DAILY = ['DGS10', 'DTB3', 'T10Y3M', 'T10Y2Y', 'BAA10Y', 'BAMLH0A0HYM2', 'VIXCLS', 'NFCI', 'STLFSI4', 'ICSA', 'DCOILBRENTEU'];

  async function loadFred(fetchText, today) {
    const recent = isoDate(new Date(today.getTime() - 430 * 864e5));
    const tasks = [], names = [];
    FRED_MONTHLY.forEach(id => { names.push(['m', id]); tasks.push(async () => parseFred(await fetchText(FRED + '?id=' + id + '&cosd=1959-01-01&fq=Monthly&fam=avg'), id)); });
    FRED_RAW.forEach(id => { names.push(['r', id]); tasks.push(async () => parseFred(await fetchText(FRED + '?id=' + id + '&cosd=1990-01-01'), id)); });
    FRED_DAILY.forEach(id => { names.push(['d', id]); tasks.push(async () => parseFred(await fetchText(FRED + '?id=' + id + '&cosd=' + recent), id)); });
    const res = await pool(tasks, 6);
    const out = { m: {}, r: {}, d: {}, errors: [] };
    res.forEach((r, i) => { const [k, id] = names[i]; if (r.ok) out[k][id] = r.value; else out.errors.push(id + ': ' + r.error); });
    return out;
  }

  async function loadOecd(fetchText, pre) {
    if (pre) { const S0 = {}; parseCsv(pre).forEach(r => { const v = parseFloat(r.OBS_VALUE); if (Number.isFinite(v) && r.REF_AREA) (S0[r.REF_AREA] = S0[r.REF_AREA] || {})[r.TIME_PERIOD] = v; }); if (!S0.G20) throw new Error('OECD CLI (client relay): G20 aggregate missing'); return S0; }
    const codes = Object.keys(CLI_WEIGHTS).concat(['G20', 'G7', 'G4E', 'A5M']).join('+');
    const urlA = OECD + codes + '.M.LI...AA...H?startPeriod=1970-01&format=csvfile';
    const urlB = OECD + codes + '.M.LI...AA...H?startPeriod=1970-01';
    let text;
    try { text = await fetchText(urlA); }
    catch (e) { text = await fetchText(urlB, 2, { Accept: 'application/vnd.sdmx.data+csv; charset=utf-8; version=1.0' }); }
    const rows = parseCsv(text);
    const S = {};
    rows.forEach(r => { const v = parseFloat(r.OBS_VALUE); if (Number.isFinite(v)) (S[r.REF_AREA] = S[r.REF_AREA] || {})[r.TIME_PERIOD] = v; });
    if (!S.G20) throw new Error('OECD CLI: G20 aggregate missing');
    return S;
  }

  async function loadEcb(fetchText, today) {
    const yearAgo = isoDate(new Date(today.getTime() - 400 * 864e5));
    const [ea, cty, irs] = await pool([
      async () => parseCsv(await fetchText(ECB + 'CISS/D.U2.Z0Z.4F.EC.SS_CIN.IDX?startPeriod=1999-01-01&format=csvdata&detail=dataonly')),
      async () => parseCsv(await fetchText(ECB + 'CISS/D.AT+BE+CN+DE+ES+FI+FR+GB+IE+IT+NL+PT+US.Z0Z.4F.EC.SS_CIN.IDX?startPeriod=' + yearAgo + '&format=csvdata&detail=dataonly')),
      async () => parseCsv(await fetchText(ECB + 'IRS/M..L.L40.CI.0000.EUR.N.Z?startPeriod=' + (today.getUTCFullYear() - 3) + '-01&format=csvdata&detail=dataonly'))
    ], 3);
    const out = { errors: [] };
    const toSeries = rows => { const S = {}; rows.forEach(r => { const v = parseFloat(r.OBS_VALUE); if (Number.isFinite(v)) (S[r.REF_AREA] = S[r.REF_AREA] || []).push({ d: r.TIME_PERIOD, v }); }); Object.values(S).forEach(a => a.sort((x, y) => x.d.localeCompare(y.d))); return S; };
    if (ea.ok) out.ea = toSeries(ea.value).U2 || []; else out.errors.push('ECB CISS euro area: ' + ea.error);
    if (cty.ok) out.ciss = toSeries(cty.value); else out.errors.push('ECB CISS countries: ' + cty.error);
    if (irs.ok) out.irs = toSeries(irs.value); else out.errors.push('ECB long-term yields: ' + irs.error);
    return out;
  }

  function parseJsonStat(j) {
    const ids = j.id, size = j.size, out = {};
    const geoPos = ids.indexOf('geo'), timePos = ids.indexOf('time');
    const idx = ids.map(d => j.dimension[d].category.index);
    const inv = idx.map(o => { const a = []; Object.entries(o).forEach(([k, v]) => { a[v] = k; }); return a; });
    const strides = size.map((_, i) => size.slice(i + 1).reduce((a, b) => a * b, 1));
    Object.entries(j.value || {}).forEach(([flat, v]) => {
      let f = Number(flat); const pos = strides.map(s => { const p = Math.floor(f / s); f -= p * s; return p; });
      const g = inv[geoPos][pos[geoPos]], t = inv[timePos][pos[timePos]];
      if (v != null) (out[g] = out[g] || []).push({ d: t, v: Number(v) });
    });
    Object.values(out).forEach(a => a.sort((x, y) => x.d.localeCompare(y.d)));
    return out;
  }
  async function loadEurostat(fetchJson, today) {
    const y = today.getUTCFullYear();
    const [esi, gdp] = await pool([
      async () => parseJsonStat(await fetchJson(ESTAT + 'ei_bssi_m_r2?indic=BS-ESI-I&s_adj=SA&sinceTimePeriod=' + (y - 2) + '-01')),
      async () => parseJsonStat(await fetchJson(ESTAT + 'namq_10_gdp?unit=CLV_PCH_PRE&s_adj=SCA&na_item=B1GQ&sinceTimePeriod=' + (y - 3) + '-Q1'))
    ], 2);
    const out = { errors: [] };
    if (esi.ok) out.esi = esi.value; else out.errors.push('Eurostat ESI: ' + esi.error);
    if (gdp.ok) out.gdp = gdp.value; else out.errors.push('Eurostat GDP: ' + gdp.error);
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Computation                                                          */
  /* ------------------------------------------------------------------ */
  function monthlyGrid(series, months) { const m = {}; (series || []).forEach(o => { m[mkey(o.d)] = o.v; }); return months.map(k => (k in m ? m[k] : null)); }
  function monthAvgFromDaily(series, k) { const v = (series || []).filter(o => mkey(o.d) === k).map(o => o.v); return v.length ? mean(v) : null; }

  function usModel(F, months) {
    const g = id => monthlyGrid(F.m[id], months);
    const gs10 = g('GS10'), tb3 = g('TB3MS'), nfci = g('NFCI'), rec = g('USREC');
    const n = months.length, cur = months[n - 1];
    // Nowcast for months not yet published as monthly averages, using the daily/weekly series
    const fill = (arr, dailyId) => { for (let i = n - 3; i < n; i++) if (arr[i] == null) { const v = monthAvgFromDaily(F.d[dailyId], months[i]); if (v != null) { arr[i] = v; arr.partial = arr.partial || {}; arr.partial[months[i]] = true; } } };
    fill(gs10, 'DGS10'); fill(tb3, 'DTB3'); fill(nfci, 'NFCI');
    const spread = gs10.map((v, i) => (v != null && tb3[i] != null ? v - tb3[i] : null));
    const min24 = spread.map((_, i) => { if (i < 23) return null; let m = Infinity; for (let k = i - 23; k <= i; k++) { if (spread[k] == null) return null; m = Math.min(m, spread[k]); } return m; });
    const feat = { spread, spreadMin24: min24, nfci };
    const prob = months.map((_, i) => {
      let z = MODEL.beta[0];
      for (let j = 0; j < MODEL.vars.length; j++) { const v = feat[MODEL.vars[j]][i]; if (v == null) return null; z += MODEL.beta[j + 1] * (v - MODEL.mean[j]) / MODEL.sd[j]; }
      return 1 / (1 + Math.exp(-z));
    });
    let li = -1; for (let i = n - 1; i >= 0; i--) if (prob[i] != null) { li = i; break; }
    const partial = li >= 0 && ((gs10.partial && gs10.partial[months[li]]) || (tb3.partial && tb3.partial[months[li]]) || (nfci.partial && nfci.partial[months[li]]));
    let lc = li; while (lc >= 0 && ((gs10.partial && gs10.partial[months[lc]]) || (tb3.partial && tb3.partial[months[lc]]) || (nfci.partial && nfci.partial[months[lc]]))) lc--;
    // contributions in logit units (z-score × beta) at latest month
    const contrib = li < 0 ? [] : MODEL.vars.map((v, j) => ({ id: v, label: MODEL.labels[v], value: r2(feat[v][li], 3), z: r2((feat[v][li] - MODEL.mean[j]) / MODEL.sd[j], 2), logit: r2(MODEL.beta[j + 1] * (feat[v][li] - MODEL.mean[j]) / MODEL.sd[j], 3) }));
    return {
      latest: li < 0 ? null : { month: months[li], p: r2(prob[li] * 100, 1), partial: !!partial },
      lastComplete: lc < 0 ? null : { month: months[lc], p: r2(prob[lc] * 100, 1) },
      change3m: li >= 3 && prob[li - 3] != null ? r2((prob[li] - prob[li - 3]) * 100, 1) : null,
      contrib, prob, rec, spread, min24, nfci, cur
    };
  }

  const STRESS_SERIES = [
    { id: 'NFCI', label: 'Chicago Fed NFCI', daily: 'NFCI' },
    { id: 'BAA10YM', label: 'Baa corporate − 10Y spread', daily: 'BAA10Y' },
    { id: 'VIXCLS', label: 'VIX equity volatility', daily: 'VIXCLS' },
    { id: 'STLFSI4', label: 'St. Louis Fed Financial Stress Index', daily: 'STLFSI4' }
  ];
  function stressScores(F, months, cissEa) {
    const idx = k => months.indexOf(k);
    const comps = STRESS_SERIES.map(s => {
      const arr = monthlyGrid(F.m[s.id], months);
      for (let i = months.length - 2; i < months.length; i++) if (arr[i] == null) { const v = monthAvgFromDaily(F.d[s.daily], months[i]); if (v != null) arr[i] = v; }
      const base = median(arr.slice(Math.max(0, idx('1990-01')), idx('2019-12') + 1));
      const peakArr = arr.slice(idx('2007-07'), idx('2009-12') + 1); const peak = Math.max(...peakArr.filter(Number.isFinite));
      const score = arr.map(v => (v == null || base == null ? null : 100 * (v - base) / (peak - base)));
      return { id: s.id, label: s.label, arr, base, peak, score };
    });
    const us = months.map((_, i) => { const v = comps.map(c => c.score[i]).filter(x => x != null); return v.length >= 2 ? mean(v) : null; });
    // Euro area CISS: monthly average of the daily index; same transformation
    let ea = months.map(() => null), eaMeta = null;
    if (cissEa && cissEa.length) {
      const g = {}; cissEa.forEach(o => { const k = mkey(o.d); (g[k] = g[k] || []).push(o.v); });
      const arr = months.map(k => (g[k] ? mean(g[k]) : null));
      const base = median(arr.slice(idx('1999-01'), idx('2019-12') + 1));
      const peak = Math.max(...arr.slice(idx('2007-07'), idx('2009-12') + 1).filter(Number.isFinite));
      ea = arr.map(v => (v == null ? null : 100 * (v - base) / (peak - base)));
      eaMeta = { base, peak, arr, peakDaily: Math.max(...cissEa.filter(o => o.d >= '2007-07' && o.d <= '2009-12').map(o => o.v)) };
    }
    return { comps, us, ea, eaMeta };
  }

  function globalCycle(S, months) {
    const g20 = monthlyGrid(Object.entries(S.G20 || {}).map(([d, v]) => ({ d, v })), months);
    const series = {}; Object.keys(CLI_WEIGHTS).forEach(k => { series[k] = monthlyGrid(Object.entries(S[k] || {}).map(([d, v]) => ({ d, v })), months); });
    const diff = months.map((_, i) => {
      if (i < 3) return null; let w = 0, tot = 0;
      Object.entries(CLI_WEIGHTS).forEach(([k, wt]) => { const a = series[k]; if (a[i] == null || a[i - 3] == null) return; tot += wt; if (a[i] < 100 && a[i] < a[i - 3]) w += wt; });
      return tot >= 40 ? 100 * w / tot : null;
    });
    let li = -1; for (let i = months.length - 1; i >= 0; i--) if (g20[i] != null) { li = i; break; }
    const countries = Object.keys(CLI_WEIGHTS).map(k => {
      const a = series[k]; let j = -1; for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) { j = i; break; }
      if (j < 0) return { iso3: k, cli: null };
      const ch3 = j >= 3 && a[j - 3] != null ? a[j] - a[j - 3] : null;
      const phase = ch3 == null ? null : a[j] >= 100 ? (ch3 >= 0 ? 'expansion' : 'downturn') : (ch3 < 0 ? 'contraction' : 'recovery');
      return { iso3: k, cli: r2(a[j], 2), month: months[j], ch3: r2(ch3, 2), phase, weight: CLI_WEIGHTS[k], spark: a.slice(Math.max(0, j - 35), j + 1).map(x => r2(x, 2)) };
    });
    return { g20, diff, li, countries };
  }

  function episodeVectors(months, P, S, G) {
    return EPISODES.map(e => {
      const a = months.indexOf(e.from), b = months.indexOf(e.to);
      if (a < 0 || b < 0) return Object.assign({}, e, { vec: null });
      let best = -1, bs = -Infinity;
      for (let i = a; i <= b; i++) { const s = S[i] != null ? S[i] : -Infinity; if (s > bs) { bs = s; best = i; } }
      let minG = null, maxD = null, maxP = null;
      for (let i = a; i <= b; i++) { if (G.g20[i] != null) minG = minG == null ? G.g20[i] : Math.min(minG, G.g20[i]); if (G.diff[i] != null) maxD = maxD == null ? G.diff[i] : Math.max(maxD, G.diff[i]); if (P[i] != null) maxP = maxP == null ? P[i] : Math.max(maxP, P[i]); }
      return Object.assign({}, e, { vec: { p: maxP == null ? null : maxP * 100, stress: bs === -Infinity ? null : bs, g20: minG, diff: maxD }, peakMonth: best >= 0 ? months[best] : null });
    });
  }
  function analogs(eps, cur, hist) {
    const dims = ['p', 'stress', 'g20', 'diff'];
    const sd = { p: sdev(hist.p), stress: sdev(hist.stress), g20: sdev(hist.g20), diff: sdev(hist.diff) };
    return eps.filter(e => e.vec).map(e => {
      let s = 0, n = 0; dims.forEach(d => { if (e.vec[d] != null && cur[d] != null && sd[d]) { s += ((e.vec[d] - cur[d]) / sd[d]) ** 2; n++; } });
      return { id: e.id, name: e.name, type: e.type, global: e.global, systemic: e.systemic, peakMonth: e.peakMonth, dims: n, distance: n ? r2(Math.sqrt(s / n), 2) : null, vec: { p: r2(e.vec.p, 1), stress: r2(e.vec.stress, 1), g20: r2(e.vec.g20, 2), diff: r2(e.vec.diff, 0) } };
    }).filter(a => a.distance != null).sort((x, y) => x.distance - y.distance);
  }

  /* Country recession-signal score: transparent piecewise-linear maps, average of available components */
  const pw = (x, pts) => { if (x == null) return null; if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return pts[pts.length - 1][1]; };
  const SCORE_RULES = {
    esi: v => pw(v, [[85, 100], [90, 75], [95, 50], [100, 25], [105, 0]]),
    ciss: v => pw(v, [[0.05, 0], [0.1, 25], [0.2, 50], [0.4, 80], [0.6, 100]]),
    spread: v => pw(v, [[1, 0], [2, 35], [3, 60], [5, 90], [6, 100]])
  };
  function cliScore(v, ch3) { if (v == null) return null; const base = pw(v, [[97, 100], [98, 80], [99, 55], [100, 30], [101, 0]]); return clamp(base + (ch3 != null && ch3 < 0 ? 15 : 0) - (ch3 != null && ch3 > 0.3 ? 10 : 0), 0, 100); }
  function gdpScore(q) { if (!q || !q.length) return null; const a = q[q.length - 1].v, b = q.length > 1 ? q[q.length - 2].v : null; if (a < 0 && b != null && b < 0) return 100; if (a < 0) return 65; if (a < 0.2) return 35; if (a < 0.4) return 15; return 0; }

  function countryRadar(G, ECBd, EST) {
    const cli = {}; G.countries.forEach(c => { if (c.cli != null) cli[c.iso3] = c; });
    const de = ECBd.irs && ECBd.irs.DE ? ECBd.irs.DE : null;
    const rows = Object.entries(COUNTRIES).map(([iso3, [name, iso2, region]]) => {
      const comp = {};
      if (cli[iso3]) comp.cli = { value: cli[iso3].cli, ch3: cli[iso3].ch3, phase: cli[iso3].phase, month: cli[iso3].month, score: r2(cliScore(cli[iso3].cli, cli[iso3].ch3), 0) };
      const es = EST.esi && (EST.esi[iso2] || (iso2 === 'EL' ? EST.esi.EL : null));
      if (es && es.length) { const l = es[es.length - 1], p = es.length > 3 ? es[es.length - 4] : null; comp.esi = { value: l.v, month: l.d, ch3: p ? r2(l.v - p.v, 1) : null, score: r2(clamp(SCORE_RULES.esi(l.v) + (p && l.v < p.v - 2 ? 10 : 0), 0, 100), 0) }; }
      const gd = EST.gdp && EST.gdp[iso2];
      if (gd && gd.length) { const last = gd.slice(-2); comp.gdp = { last: last.map(o => ({ q: o.d, v: o.v })), technical: last.length === 2 && last.every(o => o.v < 0), score: gdpScore(gd) }; }
      const ciss2 = iso2 === 'GB' ? 'GB' : iso2;
      const cs = ECBd.ciss && ECBd.ciss[ciss2];
      if (cs && cs.length) { const l = cs[cs.length - 1]; const yr = cs.map(o => o.v); comp.ciss = { value: r2(l.v, 3), date: l.d, max1y: r2(Math.max(...yr), 3), score: r2(SCORE_RULES.ciss(l.v), 0) }; }
      const irsCode = iso2 === 'EL' ? 'GR' : iso2;
      const ir = ECBd.irs && ECBd.irs[irsCode];
      if (ir && de && iso3 !== 'DEU' && region === 'Euro area') { const l = ir[ir.length - 1]; const d = de.find(o => o.d === l.d) || de[de.length - 1]; const s = l.v - d.v; comp.spread = { value: r2(s, 2), month: l.d, yield: r2(l.v, 2), score: r2(SCORE_RULES.spread(s), 0) }; }
      const scores = Object.values(comp).map(c => c.score).filter(x => x != null);
      // Weighted: GDP and CLI/ESI (real activity) count double vs financial stress
      const wts = { cli: 2, esi: 2, gdp: 2, ciss: 1, spread: 1 };
      let sw = 0, s = 0; Object.entries(comp).forEach(([k, c]) => { if (c.score != null) { s += wts[k] * c.score; sw += wts[k]; } });
      const score = sw ? s / sw : null;
      const level = score == null ? 'n/a' : score >= 60 ? 'red' : score >= 40 ? 'amber' : 'green';
      return { iso3, name, region, score: r2(score, 0), level, components: comp, coverage: scores.length };
    }).filter(r => r.coverage > 0);
    rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return rows;
  }

  function signalBoard(F, us) {
    const out = [];
    const last = id => lastValid(F.d[id] || []) || lastValid(F.m[id] || []) || lastValid(F.r[id] || []);
    const spark = (id, n = 36) => (F.m[id] || []).slice(-n).map(o => r2(o.v, 2));
    const add = (o) => out.push(o);
    const t3 = last('T10Y3M');
    add({ id: 'T10Y3M', group: 'Yield curve', label: '10Y − 3M Treasury spread', unit: 'pp', value: r2(t3 && t3.v), date: t3 && t3.d,
      status: !t3 ? 'na' : t3.v < 0 ? 'alert' : (us.min24[us.min24.length - 1] != null && us.min24.filter(x => x != null).slice(-1)[0] < 0 && t3.v > 0) ? 'watch' : t3.v < 0.5 ? 'watch' : 'ok',
      rule: 'Alert if inverted (<0). Watch if <0.5pp or if re-steepening after an inversion in the last 24m — historically recessions start after the curve un-inverts.', spark: us.spread.slice(-36).map(x => r2(x, 2)) });
    const t2 = last('T10Y2Y');
    add({ id: 'T10Y2Y', group: 'Yield curve', label: '10Y − 2Y Treasury spread', unit: 'pp', value: r2(t2 && t2.v), date: t2 && t2.d, status: !t2 ? 'na' : t2.v < 0 ? 'alert' : t2.v < 0.25 ? 'watch' : 'ok', rule: 'Alert <0, watch <0.25pp.', spark: spark('T10Y2Y') });
    const sahm = lastValid(F.m.SAHMREALTIME || []);
    add({ id: 'SAHMREALTIME', group: 'Labour market', label: 'Sahm rule (real-time)', unit: 'pp', value: r2(sahm && sahm.v), date: sahm && sahm.d, status: !sahm ? 'na' : sahm.v >= 0.5 ? 'alert' : sahm.v >= 0.3 ? 'watch' : 'ok', rule: '≥0.50pp has marked the start of every US recession since 1970 (coincident, not leading). Watch ≥0.30.', spark: spark('SAHMREALTIME') });
    const ic = F.d.ICSA || [];
    if (ic.length > 60) { const a = mean(ic.slice(-4).map(o => o.v)), lastD = ic[ic.length - 1].d; const yr = ic.filter(o => o.d <= addDays(lastD, -364) && o.d > addDays(lastD, -392)).map(o => o.v); const b = mean(yr); const yy = b ? 100 * (a / b - 1) : null;
      add({ id: 'ICSA', group: 'Labour market', label: 'Initial jobless claims, 4-wk avg', unit: 'k', value: r2(a / 1000, 0), date: lastD, extra: yy == null ? null : 'y/y ' + (yy > 0 ? '+' : '') + yy.toFixed(1) + '%', status: yy == null ? 'na' : yy >= 20 ? 'alert' : yy >= 10 ? 'watch' : 'ok', rule: 'Alert if 4-week average is ≥20% above a year ago, watch ≥10%.', spark: spark('ICSA').map(x => x == null ? null : r2(x / 1000, 0)) }); }
    const pay = F.m.PAYEMS || [];
    if (pay.length > 4) { const ch = (pay[pay.length - 1].v - pay[pay.length - 4].v) / 3; add({ id: 'PAYEMS', group: 'Labour market', label: 'Payrolls, 3-month avg change', unit: 'k', value: r2(ch, 0), date: pay[pay.length - 1].d, status: ch < 0 ? 'alert' : ch < 50 ? 'watch' : 'ok', rule: 'Alert if negative; watch <50k/month.', spark: pay.slice(-37).map((o, i, a) => i ? r2(o.v - a[i - 1].v, 0) : null).slice(1) }); }
    const hy = last('BAMLH0A0HYM2');
    add({ id: 'BAMLH0A0HYM2', group: 'Credit & stress', label: 'US high-yield OAS', unit: 'pp', value: r2(hy && hy.v), date: hy && hy.d, status: !hy ? 'na' : hy.v >= 6 ? 'alert' : hy.v >= 4.5 ? 'watch' : 'ok', rule: 'Alert ≥6pp, watch ≥4.5pp (2008 peak ≈ 20pp, 2020 ≈ 10.9pp).', spark: (F.d.BAMLH0A0HYM2 || []).filter((o, i, a) => i % 10 === 0 || i === a.length - 1).slice(-36).map(o => r2(o.v, 2)) });
    const baa = last('BAA10Y');
    add({ id: 'BAA10Y', group: 'Credit & stress', label: 'Baa corporate − 10Y spread', unit: 'pp', value: r2(baa && baa.v), date: baa && baa.d, status: !baa ? 'na' : baa.v >= 3 ? 'alert' : baa.v >= 2.5 ? 'watch' : 'ok', rule: 'Alert ≥3pp, watch ≥2.5pp (2008 peak ≈ 6pp).', spark: spark('BAA10YM') });
    const vix = last('VIXCLS');
    add({ id: 'VIXCLS', group: 'Credit & stress', label: 'VIX', unit: '', value: r2(vix && vix.v), date: vix && vix.d, status: !vix ? 'na' : vix.v >= 30 ? 'alert' : vix.v >= 22 ? 'watch' : 'ok', rule: 'Alert ≥30, watch ≥22 (2008 peak 80.9 close).', spark: spark('VIXCLS') });
    const nf = last('NFCI');
    add({ id: 'NFCI', group: 'Credit & stress', label: 'Chicago Fed NFCI', unit: '', value: r2(nf && nf.v, 3), date: nf && nf.d, status: !nf ? 'na' : nf.v >= 0 ? 'alert' : nf.v >= -0.3 ? 'watch' : 'ok', rule: 'Positive = tighter than average conditions (alert). Watch ≥ −0.30.', spark: spark('NFCI') });
    const st = last('STLFSI4');
    add({ id: 'STLFSI4', group: 'Credit & stress', label: 'St. Louis Fed Financial Stress', unit: '', value: r2(st && st.v, 2), date: st && st.d, status: !st ? 'na' : st.v >= 1 ? 'alert' : st.v >= 0 ? 'watch' : 'ok', rule: '0 = average stress. Alert ≥1, watch ≥0.', spark: spark('STLFSI4') });
    const sl = lastValid(F.r.DRTSCILM || []);
    add({ id: 'DRTSCILM', group: 'Credit & stress', label: 'Banks tightening C&I loan standards (SLOOS)', unit: '% net', value: r2(sl && sl.v, 1), date: sl && sl.d, status: !sl ? 'na' : sl.v >= 20 ? 'alert' : sl.v >= 5 ? 'watch' : 'ok', rule: 'Net % of banks tightening. Alert ≥20 (preceded 1990, 2001, 2008), watch ≥5.', spark: (F.r.DRTSCILM || []).slice(-16).map(o => r2(o.v, 1)) });
    const ip = F.m.INDPRO || [];
    if (ip.length > 13) { const yy = 100 * (ip[ip.length - 1].v / ip[ip.length - 13].v - 1); add({ id: 'INDPRO', group: 'Real activity', label: 'Industrial production y/y', unit: '%', value: r2(yy, 1), date: ip[ip.length - 1].d, status: yy < -1 ? 'alert' : yy < 0.5 ? 'watch' : 'ok', rule: 'Alert < −1%, watch < 0.5%.', spark: ip.slice(-48).map((o, i, a) => i >= 12 ? r2(100 * (o.v / a[i - 12].v - 1), 1) : null).slice(12) }); }
    const pm = F.m.PERMIT || [];
    if (pm.length > 13) { const yy = 100 * (pm[pm.length - 1].v / pm[pm.length - 13].v - 1); add({ id: 'PERMIT', group: 'Real activity', label: 'Building permits y/y', unit: '%', value: r2(yy, 1), date: pm[pm.length - 1].d, status: yy <= -15 ? 'alert' : yy <= -5 ? 'watch' : 'ok', rule: 'Housing leads the cycle. Alert ≤ −15%, watch ≤ −5%.', spark: pm.slice(-48).map((o, i, a) => i >= 12 ? r2(100 * (o.v / a[i - 12].v - 1), 1) : null).slice(12) }); }
    const um = lastValid(F.m.UMCSENT || []);
    add({ id: 'UMCSENT', group: 'Real activity', label: 'Michigan consumer sentiment', unit: '', value: r2(um && um.v, 1), date: um && um.d, status: !um ? 'na' : um.v < 65 ? 'watch' : 'ok', rule: 'Watch < 65. Capped at watch: sentiment has been depressed since 2022 without a recession.', spark: spark('UMCSENT') });
    const br = F.d.DCOILBRENTEU || [];
    if (br.length > 260) { const a = br[br.length - 1], yrAgo = br.filter(o => o.d <= addDays(a.d, -365)).slice(-1)[0]; const yy = yrAgo ? 100 * (a.v / yrAgo.v - 1) : null; add({ id: 'DCOILBRENTEU', group: 'Real activity', label: 'Brent crude', unit: '$', value: r2(a.v, 1), date: a.d, extra: yy == null ? null : 'y/y ' + (yy > 0 ? '+' : '') + yy.toFixed(0) + '%', status: yy == null ? 'na' : yy >= 50 ? 'alert' : yy >= 25 ? 'watch' : 'ok', rule: 'Oil-shock flag: alert if ≥ +50% y/y, watch ≥ +25%.', spark: spark('DCOILBRENTEU') }); }
    return out;
  }
  function addDays(d, n) { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return isoDate(t); }

  function verdict(ctx) {
    const { P, Sus, Sea, g20, g20ch6, diff, red, amber } = ctx;
    const S = Math.max(Sus ?? -Infinity, Sea ?? -Infinity);
    const SS = Number.isFinite(S) ? S : null;
    const reasons = [];
    let code = 'EXPANSION';
    const rules = [
      { code: 'SYSTEMIC', test: SS != null && SS >= 60 && ((P ?? 0) >= 40 || (g20 ?? 101) < 98.8), text: 'Financial stress ≥60% of the 2008 peak AND (US P≥40% or G20 CLI <98.8)' },
      { code: 'GLOBAL_RECESSION', test: ((g20 ?? 101) < 98.8 && (diff ?? 0) >= 60) || ((P ?? 0) >= 50 && (diff ?? 0) >= 50), text: 'G20 CLI <98.8 with ≥60% of world GDP in contraction phase, or US P≥50% with ≥50% diffusion' },
      { code: 'SYSTEMIC_WATCH', test: SS != null && SS >= 35, text: 'Financial stress ≥35% of the 2008 peak' },
      { code: 'GLOBAL_SLOWDOWN', test: (g20 ?? 101) < 99.6 || (diff ?? 0) >= 45 || (P ?? 0) >= 30, text: 'G20 CLI <99.6, or ≥45% diffusion, or US P≥30%' },
      { code: 'LATE_CYCLE', test: ((g20ch6 ?? 0) < 0 && (g20 ?? 0) >= 99.6) || (P ?? 0) >= 20 || red.length >= 3, text: 'G20 CLI above trend but falling, or US P≥20%, or ≥3 economies flashing red' },
      { code: 'LOCAL', test: red.length >= 1, text: 'At least one economy flashing red while the global cycle holds' }
    ];
    const hit = rules.find(r => r.test); if (hit) code = hit.code;
    rules.forEach(r => reasons.push({ code: r.code, met: !!r.test, rule: r.text }));
    const level = (x, a, b, c) => (x == null ? 'n/a' : x >= c ? 'high' : x >= b ? 'elevated' : x >= a ? 'moderate' : 'low');
    return {
      code, reasons,
      answers: {
        global: { level: g20 == null ? 'n/a' : (g20 < 98.8 && (diff ?? 0) >= 60) ? 'high' : (g20 < 99.6 || (diff ?? 0) >= 45) ? 'elevated' : (g20ch6 ?? 0) < 0 ? 'moderate' : 'low', g20, g20ch6, diff },
        systemic: { level: level(SS, 15, 35, 60), pctOf2008: SS == null ? null : r2(SS, 0), us: r2(Sus, 0), ea: r2(Sea, 0) },
        us: { level: level(P, 15, 30, 50), p: P },
        local: { level: red.length >= 3 ? 'high' : red.length ? 'elevated' : amber.length >= 3 ? 'moderate' : 'low', red, amber }
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Orchestrator                                                         */
  /* ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ */
  /* Banking-crisis build-up (Schularick–Taylor / JST predictor logic)    */
  /* BIS credit to private non-financial sector (% GDP) and BIS real      */
  /* residential property prices, both via FRED. Two-year changes, as in  */
  /* Dinakus (2026, Table 8), plus leave-one-out global credit growth.    */
  /* ------------------------------------------------------------------ */
  const BIS_CC = { US: 'USA', GB: 'GBR', DE: 'DEU', FR: 'FRA', IT: 'ITA', ES: 'ESP', GR: 'GRC', PT: 'PRT', IE: 'IRL', NL: 'NLD', BE: 'BEL', AT: 'AUT', FI: 'FIN', SE: 'SWE', DK: 'DNK', NO: 'NOR', CH: 'CHE', JP: 'JPN', KR: 'KOR', CN: 'CHN', IN: 'IND', ID: 'IDN', AU: 'AUS', CA: 'CAN', MX: 'MEX', BR: 'BRA', TR: 'TUR', ZA: 'ZAF', PL: 'POL', CZ: 'CZE', HU: 'HUN' };
  const BANK_W = Object.assign({ NLD: 1.2, BEL: 0.66, AUT: 0.52, PRT: 0.29, GRC: 0.25, IRL: 0.55, FIN: 0.3, SWE: 0.6, DNK: 0.41, NOR: 0.48, CHE: 0.94, POL: 0.86, CZE: 0.35, HUN: 0.22 }, CLI_WEIGHTS);
  async function loadBis(fetchText) {
    const tasks = [], names = [];
    Object.keys(BIS_CC).forEach(cc => ['PAM770A', 'R628BIS'].forEach(sfx => { names.push([cc, sfx]); tasks.push(async () => parseFred(await fetchText(FRED + '?id=Q' + cc + sfx + '&cosd=2012-01-01'), 'Q' + cc + sfx)); }));
    const res = await pool(tasks, 6); const out = {}, errors = [];
    res.forEach((r, i) => { const [cc, sfx] = names[i]; if (r.ok) (out[cc] = out[cc] || {})[sfx] = r.value; else errors.push('Q' + cc + sfx + ': ' + r.error); });
    return { data: out, errors };
  }
  function bankingBuildUp(B) {
    const rows = [];
    Object.entries(BIS_CC).forEach(([cc, iso3]) => {
      const c = B.data[cc] || {}; const cr = c.PAM770A || [], hp = c.R628BIS || [];
      const crL = cr[cr.length - 1], cr8 = cr.length > 8 ? cr[cr.length - 9] : null;
      const hpL = hp[hp.length - 1], hp8 = hp.length > 8 ? hp[hp.length - 9] : null;
      const hpMax = hp.length ? Math.max(...hp.slice(-20).map(o => o.v)) : null;
      const d8 = crL && cr8 ? crL.v - cr8.v : null;
      const h2 = hpL && hp8 ? 100 * Math.log(hpL.v / hp8.v) : null;
      const dd = hpL && hpMax ? 100 * (hpL.v / hpMax - 1) : null;
      if (d8 == null && h2 == null) return;
      rows.push({ iso3, cc, credit: crL ? r2(crL.v, 1) : null, creditDate: crL ? crL.d : null, creditD8: r2(d8, 1), house2y: r2(h2, 1), houseDate: hpL ? hpL.d : null, houseFromPeak5y: r2(dd, 1) });
    });
    // leave-one-out global credit growth (GDP-weighted), as in the JST "global credit" predictor
    const tot = rows.filter(r => r.creditD8 != null).reduce((a, r) => a + (BANK_W[r.iso3] || 0.3), 0);
    const sum = rows.filter(r => r.creditD8 != null).reduce((a, r) => a + (BANK_W[r.iso3] || 0.3) * r.creditD8, 0);
    rows.forEach(r => {
      const w = BANK_W[r.iso3] || 0.3; r.globalCreditD8 = r.creditD8 == null ? r2(sum / tot, 1) : r2((sum - w * r.creditD8) / (tot - w), 1);
      const sc = pw(r.creditD8, [[0, 0], [4, 30], [8, 60], [12, 85], [16, 100]]);
      const sh = pw(r.house2y, [[0, 0], [10, 50], [20, 100]]);
      const parts = [sc, sh].filter(x => x != null); let score = parts.length ? (sc != null && sh != null ? 0.6 * sc + 0.4 * sh : parts[0]) : null;
      // a simultaneous credit AND house-price boom is the Schularick–Taylor danger zone
      if (r.creditD8 != null && r.house2y != null && r.creditD8 > 6 && r.house2y > 10) score = Math.min(100, score + 15);
      r.score = r2(score, 0); r.level = score == null ? 'n/a' : score >= 60 ? 'red' : score >= 35 ? 'amber' : 'green';
      r.phase = r.creditD8 == null ? null : r.creditD8 > 6 && (r.house2y ?? 0) > 10 ? 'boom' : r.creditD8 > 3 ? 'building' : (r.houseFromPeak5y ?? 0) < -10 ? 'bust / deleveraging' : 'neutral';
    });
    rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return { rows, globalCreditD8: tot ? r2(sum / tot, 1) : null };
  }

  /* ------------------------------------------------------------------ */
  /* Evidence ledger (Dinakus 2026): episodes as the unit of evidence,   */
  /* clustered AUROC variance (Obuchowski 1997), leave-one-episode-out,  */
  /* proper scores, minimum detectable differences and Sarlin usefulness */
  /* ------------------------------------------------------------------ */
  function clusteredAuc(p, y, cl) {
    const pos = [], neg = []; p.forEach((v, i) => (y[i] ? pos : neg).push(i));
    const M = pos.length, N = neg.length; if (!M || !N) return null;
    const V10 = new Map(), V01 = new Map();
    pos.forEach(i => { let s = 0; neg.forEach(j => { s += p[i] > p[j] ? 1 : p[i] === p[j] ? 0.5 : 0; }); V10.set(i, s / N); });
    neg.forEach(j => { let s = 0; pos.forEach(i => { s += p[i] > p[j] ? 1 : p[i] === p[j] ? 0.5 : 0; }); V01.set(j, s / M); });
    const A = [...V10.values()].reduce((a, b) => a + b, 0) / M;
    const U10 = {}, U01 = {};
    pos.forEach(i => { U10[cl[i]] = (U10[cl[i]] || 0) + (V10.get(i) - A); });
    neg.forEach(j => { U01[cl[j]] = (U01[cl[j]] || 0) + (V01.get(j) - A); });
    const keys = [...new Set(Object.keys(U10).concat(Object.keys(U01)))]; const K = keys.length;
    let s10 = 0, s01 = 0, sx = 0; keys.forEach(k => { const a = U10[k] || 0, b = U01[k] || 0; s10 += a * a; s01 += b * b; sx += a * b; });
    const v = K / (K - 1) * (s10 / (M * M) + s01 / (N * N) + 2 * sx / (M * N));
    return { auc: A, se: Math.sqrt(Math.max(v, 0)), K, M, N };
  }
  function mddFromEpisodes(K) { // Dinakus (2026) Table 5, calibrated row; ∝ 1/√K outside the grid
    const g = [[11, 0.122], [22, 0.090], [45, 0.067], [90, 0.047], [180, 0.035]];
    if (K <= 11) return 0.122 * Math.sqrt(11 / K); if (K >= 180) return 0.035 * Math.sqrt(180 / K);
    for (let i = 1; i < g.length; i++) if (K <= g[i][0]) { const [k0, m0] = g[i - 1], [k1, m1] = g[i]; const t = (Math.log(K) - Math.log(k0)) / (Math.log(k1) - Math.log(k0)); return m0 + t * (m1 - m0); }
    return null;
  }
  function evidenceLedger(months, rec) {
    const oosStart = months.indexOf(MODEL.oosStart), H = 12;
    const p = [], y = [], t = [], ep = [];
    // label y_t and the episode (next onset) each pre-recession month belongs to
    const onsets = []; for (let i = 1; i < months.length; i++) if (rec[i] === 1 && rec[i - 1] === 0) onsets.push(i);
    MODEL.oos.forEach((v, k) => {
      const i = oosStart + k; if (v == null || rec[i] !== 0) return;
      let any = 0, known = true; for (let h = 1; h <= H; h++) { const r = rec[i + h]; if (r == null) { known = false; break; } if (r === 1) any = 1; }
      if (!known) return; const on = any ? onsets.find(o => o > i) : null;
      p.push(v / 100); y.push(any); t.push(i); ep.push(any ? months[on] : null);
    });
    if (!p.length) return null;
    const episodes = [...new Set(ep.filter(Boolean))];
    const naive = clusteredAuc(p, y, p.map((_, k) => 'o' + k));
    const byEp = clusteredAuc(p, y, p.map((_, k) => (y[k] ? 'E' + ep[k] : 'o' + k)));
    const robust = clusteredAuc(p, y, p.map((_, k) => (y[k] ? 'E' + ep[k] : 'B' + Math.floor(t[k] / 24))));
    const ci = (r, z) => [r2(Math.max(0, r.auc - z * r.se), 3), r2(Math.min(1, r.auc + z * r.se), 3)];
    const leaveOut = episodes.map(e => {
      const yr = +e.slice(0, 4); const keep = p.map((_, k) => !(ep[k] === e) && !(+months[t[k]].slice(0, 4) >= yr - 1 && +months[t[k]].slice(0, 4) <= yr));
      const pp = p.filter((_, k) => keep[k]), yy = y.filter((_, k) => keep[k]); const r = clusteredAuc(pp, yy, pp.map((_, k) => 'o' + k));
      return { episode: e, auc: r ? r2(r.auc, 3) : null };
    });
    const base = y.reduce((a, b) => a + b, 0) / y.length;
    const brier = p.reduce((a, v, k) => a + (v - y[k]) ** 2, 0) / p.length, brierBase = y.reduce((a, v) => a + (base - v) ** 2, 0) / y.length;
    const ll = q => -q.reduce((a, v, k) => a + (y[k] ? Math.log(Math.max(v, 1e-4)) : Math.log(Math.max(1 - v, 1e-4))), 0) / q.length;
    // Sarlin (2013): L(μ) = μ·T1·P1 + (1−μ)·T2·P2 ; U_r = (min(μ·P1,(1−μ)·P2) − L) / min(μ·P1,(1−μ)·P2)
    const P1 = base, P2 = 1 - base;
    const sarlin = mu => { let best = null; for (let tau = 0.02; tau <= 0.9; tau += 0.01) { let fn = 0, fp = 0, np = 0, nn = 0; p.forEach((v, k) => { if (y[k]) { np++; if (v < tau) fn++; } else { nn++; if (v >= tau) fp++; } }); const T1 = fn / np, T2 = fp / nn; const L = mu * T1 * P1 + (1 - mu) * T2 * P2; const Ua = Math.min(mu * P1, (1 - mu) * P2) - L; const Ur = Ua / Math.min(mu * P1, (1 - mu) * P2); if (!best || Ur > best.Ur) best = { tau: r2(tau, 2), T1: r2(T1, 3), T2: r2(T2, 3), Ur: r2(Ur, 3) }; } return Object.assign({ mu }, best); };
    return {
      window: MODEL.oosStart + ' → ' + months[t[t.length - 1]], months: p.length, positives: y.filter(Boolean).length, episodes, waves: episodes.length,
      auc: r2(naive.auc, 3), ciNaive90: ci(naive, 1.645), ciEpisode90: ci(byEp, 1.645), ciRobust90: ci(robust, 1.645),
      seInflation: { episode: r2(byEp.se / naive.se, 2), robust: r2(robust.se / naive.se, 2) }, clusters: { robust: robust.K },
      leaveOneEpisodeOut: leaveOut, mdd80: r2(mddFromEpisodes(episodes.length), 3), mddTable: [[11, 0.122], [22, 0.090], [45, 0.067], [90, 0.047], [180, 0.035]],
      scores: { brier: r2(brier, 4), brierClimatology: r2(brierBase, 4), log: r2(ll(p), 3), logClimatology: r2(ll(p.map(() => base)), 3), meanForecast: r2(100 * p.reduce((a, b) => a + b, 0) / p.length, 1), baseRate: r2(100 * base, 1) },
      sarlin: [sarlin(0.5), sarlin(0.8)]
    };
  }

  async function compute(opts) {
    const today = opts.today || new Date();
    const fetchText = opts.fetchText, fetchJson = opts.fetchJson || (async u => JSON.parse(await fetchText(u)));
    const cur = isoDate(today).slice(0, 7);
    const months = monthRange('1959-01', cur);
    const sources = {};
    const [Fr, Or, Er, Sr, Br0] = await pool([
      () => loadFred(fetchText, today), () => loadOecd(fetchText, opts.oecdText), () => loadEcb(fetchText, today), () => loadEurostat(fetchJson, today), () => loadBis(fetchText)
    ], 5);
    const F = Fr.ok ? Fr.value : { m: {}, r: {}, d: {}, errors: ['FRED: ' + Fr.error] };
    const S = Or.ok ? Or.value : {};
    const E = Er.ok ? Er.value : { errors: ['ECB: ' + Er.error] };
    const ES = Sr.ok ? Sr.value : { errors: ['Eurostat: ' + Sr.error] };
    sources.fred = { ok: Object.keys(F.m).length > 0, series: Object.keys(F.m).length + Object.keys(F.d).length + Object.keys(F.r).length, errors: F.errors };
    sources.oecd = { ok: Or.ok, relay: !!opts.oecdText, errors: Or.ok ? [] : [Or.error] };
    sources.ecb = { ok: !!(E.ea || E.ciss), errors: E.errors };
    sources.eurostat = { ok: !!(ES.esi || ES.gdp), errors: ES.errors };
    const BIS = Br0.ok ? Br0.value : { data: {}, errors: ['BIS via FRED: ' + Br0.error] };
    sources.bis = { ok: Object.keys(BIS.data).length > 0, series: Object.values(BIS.data).reduce((a, o) => a + Object.keys(o).length, 0), errors: BIS.errors };

    const us = usModel(F, months);
    const st = stressScores(F, months, E.ea);
    const G = globalCycle(S, months);
    const countries = countryRadar(G, E, ES);
    const signals = signalBoard(F, us);
    const banking = bankingBuildUp(BIS);
    banking.rows.forEach(b => { const c = countries.find(x => x.iso3 === b.iso3); if (c) c.banking = b; else { const meta = COUNTRIES[b.iso3]; countries.push({ iso3: b.iso3, name: meta ? meta[0] : b.iso3, region: meta ? meta[2] : 'Other', score: null, level: 'n/a', components: {}, coverage: 0, banking: b }); } });
    const ledger = evidenceLedger(months, us.rec);

    const lastIdx = arr => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return i; return -1; };
    const iUs = lastIdx(st.us), iEa = lastIdx(st.ea), iD = lastIdx(G.diff);
    const P = us.latest ? us.latest.p : null;
    const g20 = G.li >= 0 ? G.g20[G.li] : null;
    const g20ch6 = G.li >= 6 && G.g20[G.li - 6] != null ? G.g20[G.li] - G.g20[G.li - 6] : null;
    const diffNow = iD >= 0 ? G.diff[iD] : null;
    const red = countries.filter(c => c.level === 'red').map(c => c.iso3), amber = countries.filter(c => c.level === 'amber').map(c => c.iso3);
    const Sus = iUs >= 0 ? st.us[iUs] : null, Sea = iEa >= 0 ? st.ea[iEa] : null;

    const combinedStress = months.map((_, i) => { const a = st.us[i], b = st.ea[i]; return a == null && b == null ? null : Math.max(a ?? -Infinity, b ?? -Infinity); });
    const eps = episodeVectors(months, us.prob, combinedStress, G);
    const from = months.indexOf('1985-01');
    const hist = { p: us.prob.slice(from).map(x => x == null ? null : x * 100), stress: combinedStress.slice(from), g20: G.g20.slice(from), diff: G.diff.slice(from) };
    const curVec = { p: P, stress: Number.isFinite(Math.max(Sus ?? -Infinity, Sea ?? -Infinity)) ? Math.max(Sus ?? -Infinity, Sea ?? -Infinity) : null, g20, diff: diffNow };
    const an = analogs(eps, curVec, hist);
    const v = verdict({ P, Sus, Sea, g20, g20ch6, diff: diffNow, red, amber });
    v.answers.systemic.boomRed = banking.rows.filter(b => b.level === 'red').map(b => b.iso3);
    v.answers.systemic.boomAmber = banking.rows.filter(b => b.level === 'amber').map(b => b.iso3);
    v.answers.systemic.globalCreditD8 = banking.globalCreditD8;
    if (ledger) { const sl = ledger.sarlin.find(x => x.mu === 0.8 && x.Ur > 0) || ledger.sarlin.find(x => x.Ur > 0); if (sl) { v.answers.us.alarmThreshold = r2(sl.tau * 100, 0); v.answers.us.alarmMu = sl.mu; v.answers.us.aboveAlarm = P != null && P >= sl.tau * 100; } }

    const h0 = months.indexOf('1970-01');
    const H = months.slice(h0).map((m, k) => { const i = k + h0; return [m, us.prob[i] == null ? null : r2(us.prob[i] * 100, 1), us.rec[i], r2(st.us[i], 1), r2(st.ea[i], 1), r2(G.g20[i], 2), r2(G.diff[i], 0), r2(us.spread[i], 2)]; });
    while (H.length && H[H.length - 1].slice(1).every(x => x == null)) H.pop();

    return {
      version: '1.2', generatedAt: new Date().toISOString(), asOf: isoDate(today), sources,
      verdict: v,
      us: { model: { id: MODEL.id, fitted: MODEL.fitted, target: MODEL.target, vars: MODEL.vars.map(k => ({ id: k, label: MODEL.labels[k] })), beta: MODEL.beta, mean: MODEL.mean, sd: MODEL.sd, lambda: MODEL.lambda, sample: MODEL.sample, backtest: MODEL.backtest }, latest: us.latest, lastComplete: us.lastComplete, change3m: us.change3m, contributions: us.contrib, oos: { start: MODEL.oosStart, series: MODEL.oos } },
      stress: {
        us: { current: r2(Sus, 1), month: iUs >= 0 ? months[iUs] : null, components: st.comps.map(c => { const i = lastIdx(c.arr); return { id: c.id, label: c.label, value: i >= 0 ? r2(c.arr[i], 3) : null, month: i >= 0 ? months[i] : null, baseline: r2(c.base, 3), gfcPeak: r2(c.peak, 3), pctOf2008: i >= 0 ? r2(c.score[i], 1) : null }; }) },
        ea: { current: r2(Sea, 1), month: iEa >= 0 ? months[iEa] : null, latestDaily: E.ea && E.ea.length ? { date: E.ea[E.ea.length - 1].d, value: r2(E.ea[E.ea.length - 1].v, 4) } : null, baseline: st.eaMeta ? r2(st.eaMeta.base, 4) : null, gfcPeakMonthly: st.eaMeta ? r2(st.eaMeta.peak, 4) : null, gfcPeakDaily: st.eaMeta ? r2(st.eaMeta.peakDaily, 4) : null }
      },
      global: { g20: { value: r2(g20, 2), month: G.li >= 0 ? months[G.li] : null, change6m: r2(g20ch6, 2) }, diffusion: { value: r2(diffNow, 0), month: iD >= 0 ? months[iD] : null }, weights: CLI_WEIGHTS, countries: G.countries },
      episodes: eps.map(e => ({ id: e.id, name: e.name, type: e.type, from: e.from, to: e.to, global: e.global, systemic: e.systemic, peakMonth: e.peakMonth, vec: e.vec ? { p: r2(e.vec.p, 1), stress: r2(e.vec.stress, 1), g20: r2(e.vec.g20, 2), diff: r2(e.vec.diff, 0) } : null })),
      analogs: an.slice(0, 6), current: { p: r2(curVec.p, 1), stress: r2(curVec.stress, 1), g20: r2(g20, 2), diff: r2(diffNow, 0) },
      countries, signals, banking, evidence: ledger,
      history: { cols: ['month', 'usRecProb12m', 'usrec', 'usStressPct2008', 'eaStressPct2008', 'g20Cli', 'downturnDiffusion', 'termSpread'], rows: H }
    };
  }

  return { compute, OECD_URL: () => OECD + Object.keys(CLI_WEIGHTS).concat(['G20']).join('+') + '.M.LI...AA...H?startPeriod=1970-01&format=csvfile', MODEL, EPISODES, CLI_WEIGHTS, COUNTRIES, _internal: { parseCsv, parseJsonStat, parseFred, monthRange, addMonths, cliScore, gdpScore, SCORE_RULES } };
});
