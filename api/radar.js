// Vercel Serverless Function · GET /api/radar
// Aggregates FRED, OECD, ECB and Eurostat server-side (FRED has no CORS), computes the
// recession & crisis radar and caches the result at Vercel's edge.
const core = require('../radar-core.js');

const UA = 'WorldFaultline-Radar/1.0 (+https://world-faultline.vercel.app; open research)';

async function fetchText(url, tries = 2) {
  let lastErr;
  for (let k = 0; k < tries; k++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/csv,application/json,*/*' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) {
      lastErr = e;
      await new Promise(res => setTimeout(res, 600 * (k + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

module.exports = async (req, res) => {
  const t0 = Date.now();
  try {
    const out = await core.compute({ fetchText });
    out.computeMs = Date.now() - t0;
    const healthy = out.sources.fred.ok && out.sources.oecd.ok;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Fresh for 1h at the edge, serve stale up to 1 day while revalidating in the background
    res.setHeader('Cache-Control', healthy ? 'public, s-maxage=3600, stale-while-revalidate=86400' : 'public, s-maxage=300, stale-while-revalidate=3600');
    res.status(200).send(JSON.stringify(out));
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'radar_compute_failed', message: String(e && e.message || e) });
  }
};
