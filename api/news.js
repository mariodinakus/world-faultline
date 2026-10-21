// Vercel Serverless Function · GET /api/news?id=<flashpoint>
// One GDELT DOC 2.0 news-intensity timeline per call (GDELT is slow and asks for ≥5 s between requests).
const FLASHPOINTS = {
  ww3: '("world war iii" OR "world war 3" OR "third world war")',
  nuclear: '("nuclear war" OR "nuclear strike" OR "tactical nuclear")',
  hormuz: '"strait of hormuz"',
  taiwan: '("taiwan strait" OR "taiwan blockade" OR "invade taiwan")',
  nato: '(nato russia "article 5")',
  korea: '("north korea" missile)'
};
const mean = a => { const v = a.filter(Number.isFinite); return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
const median = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); if (!v.length) return null; const h = v.length >> 1; return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2; };
const r = (x, n) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10 ** n) / 10 ** n);

module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || '').toLowerCase();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!FLASHPOINTS[id]) { res.setHeader('Cache-Control', 'no-store'); return res.status(400).send(JSON.stringify({ error: 'unknown flashpoint', ids: Object.keys(FLASHPOINTS) })); }
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent(FLASHPOINTS[id]) + '&mode=timelinevol&timespan=3months&format=json';
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const resp = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'WorldFaultline-News/1.0 (+https://world-faultline.vercel.app)' } });
    const text = await resp.text();
    if (!resp.ok) throw new Error('GDELT HTTP ' + resp.status);
    let j; try { j = JSON.parse(text); } catch (e) { throw new Error('GDELT: ' + text.replace(/\s+/g, ' ').slice(0, 120)); }
    const data = (j.timeline && j.timeline[0] && j.timeline[0].data) || [];
    const vals = data.map(o => ({ d: String(o.date).slice(0, 8), v: +o.value })).filter(o => Number.isFinite(o.v));
    if (!vals.length) throw new Error('GDELT returned no timeline');
    const last7 = mean(vals.slice(-7).map(o => o.v)), base = median(vals.map(o => o.v));
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    res.status(200).send(JSON.stringify({ id, last7: r(last7, 4), median90d: r(base, 4), ratio: base ? r(last7 / base, 2) : null, max90d: r(Math.max(...vals.map(o => o.v)), 4), from: vals[0].d, to: vals[vals.length - 1].d, spark: vals.filter((_, k) => k % 3 === 0).map(o => r(o.v, 4)) }));
  } catch (e) {
    res.setHeader('Cache-Control', 'public, s-maxage=600');
    res.status(200).send(JSON.stringify({ id, error: String(e && e.message || e) }));
  } finally { clearTimeout(t); }
};
