// Vercel Serverless Function · GET /api/geo
// Geopolitical escalation layer for the Recession Lab:
//   · Caldara–Iacoviello Geopolitical Risk index (monthly since 1900, daily recent)
//   · GDELT news-intensity timelines for flashpoints (last 3 months)
//   · Brent war premium vs the pre-war (February 2026) level, from FRED
//   · Bulletin of the Atomic Scientists Doomsday Clock (dated, sourced constant)
// Every component degrades to null independently; nothing is imputed.
const XLSX = require('../lib/xlsx.core.min.js');

const UA = 'WorldFaultline-Geo/1.0 (+https://world-faultline.vercel.app; open research)';
const GPR_M = 'https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls';
const GPR_D = 'https://www.matteoiacoviello.com/gpr_files/data_gpr_daily_recent.xls';
const FRED = 'https://fred.stlouisfed.org/graph/fredgraph.csv';

const FLASHPOINTS = [
  { id: 'ww3', label: 'World War III / great-power war', q: '("world war iii" OR "world war 3" OR "third world war")' },
  { id: 'nuclear', label: 'Nuclear use / threats', q: '("nuclear war" OR "nuclear strike" OR "tactical nuclear")' },
  { id: 'hormuz', label: 'Strait of Hormuz', q: '"strait of hormuz"' },
  { id: 'taiwan', label: 'Taiwan Strait / blockade', q: '("taiwan strait" OR "taiwan blockade" OR "invade taiwan")' },
  { id: 'nato', label: 'NATO–Russia escalation', q: '(nato russia "article 5")' },
  { id: 'korea', label: 'Korean peninsula', q: '("north korea" missile)' }
];

const DOOMSDAY = { seconds: 85, set: '2026-01-27', source: 'Bulletin of the Atomic Scientists', history: [[1947, 420], [1953, 120], [1962, 420], [1984, 180], [1991, 1020], [2007, 300], [2018, 120], [2020, 100], [2023, 90], [2025, 89], [2026, 85]] };
const PREWAR = { from: '2026-02-01', to: '2026-02-27', note: 'US–Israel war on Iran began 28 Feb 2026; Strait of Hormuz effectively closed since' };

async function get(url, binary) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: '*/*' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return binary ? Buffer.from(await r.arrayBuffer()) : await r.text();
  } finally { clearTimeout(t); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const r2 = (x, n = 1) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10 ** n) / 10 ** n);
const mean = a => { const v = a.filter(Number.isFinite); return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
const median = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); if (!v.length) return null; const h = v.length >> 1; return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2; };

function toKey(v, daily) {
  let d;
  if (v instanceof Date) d = new Date(v.getTime() + 12 * 3600e3);
  else if (typeof v === 'number') { const p = XLSX.SSF.parse_date_code(v); if (!p) return null; d = new Date(Date.UTC(p.y, p.m - 1, p.d, 12)); }
  else if (typeof v === 'string' && /^\d{4}-\d{2}/.test(v)) d = new Date(v.slice(0, 10) + 'T12:00:00Z');
  else return null;
  const s = d.toISOString(); return daily ? s.slice(0, 10) : s.slice(0, 7);
}
function sheetRows(buf) {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: null });
  const hi = rows.findIndex(r => r && r.some(c => typeof c === 'string' && /^GPR/i.test(c)));
  if (hi < 0) throw new Error('GPR header not found');
  const head = rows[hi].map(c => (c == null ? '' : String(c).trim()));
  return { head, body: rows.slice(hi + 1) };
}

async function gprMonthly() {
  const { head, body } = sheetRows(await get(GPR_M, true));
  const iDate = head.findIndex(h => /^(month|date)$/i.test(h)) >= 0 ? head.findIndex(h => /^(month|date)$/i.test(h)) : 0;
  const col = n => head.findIndex(h => h.toUpperCase() === n);
  const iG = col('GPR'), iH = col('GPRH'), iT = col('GPRT'), iA = col('GPRA');
  const S = [];
  body.forEach(r => { const k = toKey(r[iDate]); if (!k) return; const v = x => (x == null || x === '' || !Number.isFinite(+x) ? null : +x); S.push({ m: k, gpr: v(r[iG]), gprh: v(r[iH]), threat: iT >= 0 ? v(r[iT]) : null, act: iA >= 0 ? v(r[iA]) : null }); });
  S.sort((a, b) => a.m.localeCompare(b.m));
  const H = S.filter(o => o.gprh != null);
  const peak = (a, b) => { const w = H.filter(o => o.m >= a && o.m <= b); return w.length ? w.reduce((x, y) => (y.gprh > x.gprh ? y : x)) : null; };
  const lastH = H[H.length - 1], lastG = [...S].reverse().find(o => o.gpr != null);
  const marks = [
    ['WWI (1914–18)', '1914-07', '1918-11'], ['WWII (1939–45)', '1939-09', '1945-08'], ['Korean War outbreak', '1950-06', '1950-12'],
    ['Cuban Missile Crisis', '1962-10', '1962-11'], ['9/11', '2001-09', '2001-10'], ['Iraq invasion', '2003-03', '2003-04'],
    ['Russia invades Ukraine', '2022-02', '2022-04'], ['Iran war 2026', '2026-02', lastH ? lastH.m : '2026-12']
  ].map(([n, a, b]) => { const p = peak(a, b); return p ? { name: n, month: p.m, gprh: r2(p.gprh, 0) } : null; }).filter(Boolean);
  const ww2 = marks.find(x => x.name.startsWith('WWII'));
  const longMedian = median(H.map(o => o.gprh));
  const pct = (x, arr) => { const v = arr.filter(Number.isFinite).sort((a, b) => a - b); if (!v.length || x == null) return null; let k = 0; while (k < v.length && v[k] <= x) k++; return 100 * k / v.length; };
  return {
    latest: lastH ? { month: lastH.m, gprh: r2(lastH.gprh, 0), gpr: lastG ? r2(lastG.gpr, 0) : null, gprMonth: lastG ? lastG.m : null, threat: lastG ? r2(lastG.threat, 0) : null, act: lastG ? r2(lastG.act, 0) : null } : null,
    pctOfWW2: lastH && ww2 ? r2(100 * lastH.gprh / ww2.gprh, 0) : null,
    percentileSince1900: lastH ? r2(pct(lastH.gprh, H.map(o => o.gprh)), 1) : null,
    medianSince1900: r2(longMedian, 0), marks,
    series: H.filter(o => o.m >= '1900-01').map(o => [o.m, r2(o.gprh, 0)]),
    recent: S.filter(o => o.m >= '2019-01' && o.gpr != null).map(o => [o.m, r2(o.gpr, 0), r2(o.threat, 0), r2(o.act, 0)])
  };
}
async function gprDaily() {
  const { head, body } = sheetRows(await get(GPR_D, true));
  const iDate = head.findIndex(h => /^(date|day)$/i.test(h)) >= 0 ? head.findIndex(h => /^(date|day)$/i.test(h)) : 0;
  const iG = head.findIndex(h => /^GPRD$/i.test(h));
  const S = body.map(r => ({ d: toKey(r[iDate], true), v: r[iG] == null ? null : +r[iG] })).filter(o => o.d && Number.isFinite(o.v)).sort((a, b) => a.d.localeCompare(b.d));
  if (!S.length) throw new Error('no daily rows');
  const last = S[S.length - 1];
  return { last: { date: last.d, value: r2(last.v, 0) }, avg7: r2(mean(S.slice(-7).map(o => o.v)), 0), avg30: r2(mean(S.slice(-30).map(o => o.v)), 0), median365: r2(median(S.slice(-365).map(o => o.v)), 0), series: S.slice(-120).map(o => [o.d, r2(o.v, 0)]) };
}
async function gdelt() {
  const out = [];
  for (let i = 0; i < FLASHPOINTS.length; i++) {
    const f = FLASHPOINTS[i];
    if (i) await sleep(5600); // GDELT asks for ≥5 s between requests
    try {
      const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent(f.q) + '&mode=timelinevol&timespan=3months&format=json';
      const j = JSON.parse(await get(url));
      const data = (j.timeline && j.timeline[0] && j.timeline[0].data) || [];
      const vals = data.map(o => ({ d: String(o.date).slice(0, 8), v: +o.value })).filter(o => Number.isFinite(o.v));
      const last7 = mean(vals.slice(-7).map(o => o.v)), base = median(vals.map(o => o.v));
      out.push({ id: f.id, label: f.label, last7: r2(last7, 4), median90d: r2(base, 4), ratio: base ? r2(last7 / base, 2) : null, max90d: r2(Math.max(...vals.map(o => o.v)), 4), spark: vals.filter((_, k) => k % 3 === 0).map(o => r2(o.v, 4)) });
    } catch (e) { out.push({ id: f.id, label: f.label, error: String(e.message || e) }); }
  }
  return out;
}
async function brent() {
  const t = await get(FRED + '?id=DCOILBRENTEU&cosd=2025-12-01');
  const rows = t.trim().split('\n').slice(1).map(l => { const [d, v] = l.split(','); return { d, v: parseFloat(v) }; }).filter(o => Number.isFinite(o.v));
  const pre = mean(rows.filter(o => o.d >= PREWAR.from && o.d <= PREWAR.to).map(o => o.v)); const last = rows[rows.length - 1];
  const peak = rows.filter(o => o.d >= '2026-02-28').reduce((a, o) => (o.v > a.v ? o : a), { v: -1 });
  return { last: { date: last.d, value: r2(last.v, 2) }, prewar: r2(pre, 2), premiumPct: pre ? r2(100 * (last.v / pre - 1), 1) : null, warPeak: peak.v > 0 ? { date: peak.d, value: r2(peak.v, 2) } : null, series: rows.filter((_, k) => k % 2 === 0).map(o => [o.d, r2(o.v, 1)]) };
}

function escalationIndex(g, gd, news, oil) {
  // Transparent 0–100 composite; NOT a probability of world war.
  const parts = [];
  if (g && g.pctOfWW2 != null) parts.push({ id: 'gpr', label: 'Geopolitical Risk (GPRH) as % of the WWII peak', value: g.pctOfWW2, score: Math.min(100, g.pctOfWW2), weight: 0.35 });
  const nn = (news || []).filter(n => n.ratio != null);
  if (nn.length) { const top = nn.filter(n => ['ww3', 'nuclear', 'taiwan', 'nato'].includes(n.id)); const r = mean((top.length ? top : nn).map(n => n.ratio)); parts.push({ id: 'news', label: 'Great-power flashpoint news intensity (7d vs 90d median)', value: r2(r, 2), score: Math.max(0, Math.min(100, 50 + 50 * Math.log2(r))), weight: 0.2 }); }
  const s = DOOMSDAY.seconds; parts.push({ id: 'clock', label: 'Doomsday Clock (log scale, 1020 s = safest ever)', value: s, score: Math.max(0, Math.min(100, 100 * (1 - Math.log(s) / Math.log(1020)))), weight: 0.2 });
  if (oil && oil.premiumPct != null) parts.push({ id: 'oil', label: 'War premium in Brent vs pre-war level', value: oil.premiumPct, score: Math.max(0, Math.min(100, oil.premiumPct / 1.5)), weight: 0.25 });
  const w = parts.reduce((a, p) => a + p.weight, 0);
  const val = w ? parts.reduce((a, p) => a + p.weight * p.score, 0) / w : null;
  parts.forEach(p => { p.score = r2(p.score, 0); });
  return { value: r2(val, 0), coverage: r2(w, 2), parts, bands: [[0, 'Calm'], [25, 'Tense'], [45, 'Crisis'], [65, 'Severe crisis — Cold-War peak territory'], [85, 'Systemic great-power war']] };
}

module.exports = async (req, res) => {
  const t0 = Date.now();
  const settle = p => p.then(v => ({ ok: true, v }), e => ({ ok: false, e: String(e && e.message || e) }));
  const [gm, gd, oil, news] = await Promise.all([settle(gprMonthly()), settle(gprDaily()), settle(brent()), settle(gdelt())]);
  const out = {
    generatedAt: new Date().toISOString(),
    sources: { gprMonthly: gm.ok ? 'ok' : gm.e, gprDaily: gd.ok ? 'ok' : gd.e, brent: oil.ok ? 'ok' : oil.e, gdelt: news.ok ? 'ok' : news.e },
    gpr: gm.ok ? gm.v : null, gprDaily: gd.ok ? gd.v : null, brent: oil.ok ? oil.v : null, news: news.ok ? news.v : null,
    doomsday: DOOMSDAY, prewar: PREWAR
  };
  out.escalation = escalationIndex(out.gpr, out.gprDaily, out.news, out.brent);
  out.computeMs = Date.now() - t0;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=10800, stale-while-revalidate=86400');
  res.status(200).send(JSON.stringify(out));
};
