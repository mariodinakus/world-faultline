/* WORLD FAULTLINE · RECESSION LAB — scenarios, imponderables & the escalation index (v1.0)
 * Every transmission coefficient is printed on the page with its source. Presets marked
 * ILLUSTRATIVE have no published estimate behind their size and are labelled as such.
 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d = 1) => (v == null || !Number.isFinite(Number(v)) ? '—' : Number(v).toFixed(d));
  const sgn = (v, d = 1) => (v == null || !Number.isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const el = () => window.WF_LOCALE === 'el';
  const T = (en, gr) => (el() ? gr : en);

  /* ---------------- calibration (all sourced) ---------------- */
  const CAL = {
    baseGrowth: 3.4, baseOil: 87.4, // IMF WEO Oct 2026: world growth 2027 3.4%, Brent assumption 2027 $87.39
    oilSlope: 0.039,                 // pp of world growth per $1 of Brent — slope of IMF WEO Apr 2026 scenarios ($82→3.1%, $110→2.0%)
    oilSlopeSd: 0.010,
    cliPerPp: 1.4,                   // G20 CLI points per pp of world growth (2009: −3.6pp ↔ −4.6 pts; 2020: −5.7pp ↔ −10.6 pts)
    spreadPerRate: -0.6,             // term-spread change per pp of policy-rate change (short end moves ~1:1, long end ~0.4)
    baaPerNfci: 0.6,                 // Baa−10Y spread change per NFCI unit (2008: NFCI +3.5, Baa +3.3pp → ≈0.9; 2020: +1.0 → +1.0; conservative 0.6)
    thresholds: [[2.0, 'IMF "close call" for a global recession'], [1.0, 'global recession (world output per head falls)'], [0, 'world output contracts (2009, 2020)']]
  };
  const REGION_PROFILE = {
    none: { label: 'No regional war shock', mult: {} },
    gulf: { label: 'Gulf / energy importers', mult: { 'Asia-Pacific': 1.2, 'Euro area': 1.1, Europe: 1.1, Americas: 0.8, Africa: 1.0 }, iso: { USA: 0.6, CAN: 0.4, NOR: 0.3, BRA: 0.6, MEX: 0.7 }, ea: 1.2 },
    europe: { label: 'Europe front-line', mult: { 'Euro area': 2.0, Europe: 2.2, Americas: 0.5, 'Asia-Pacific': 0.6, Africa: 0.7 }, iso: { POL: 3.0, LTU: 3.5, LVA: 3.5, EST: 3.5, FIN: 2.8, DEU: 2.2, USA: 0.6 }, ea: 1.8 },
    asia: { label: 'Indo-Pacific (Bloomberg Economics country ratios)', mult: { 'Asia-Pacific': 1.4, 'Euro area': 0.8, Europe: 0.8, Americas: 0.7, Africa: 0.8 }, iso: { CHN: 1.64, JPN: 1.5, KOR: 1.8, USA: 0.66, AUS: 1.1, IND: 0.9, IDN: 1.1 }, ea: 1.0 },
    global: { label: 'Global great-power war', mult: { 'Asia-Pacific': 1.3, 'Euro area': 1.3, Europe: 1.4, Americas: 0.9, Africa: 0.8 }, iso: { USA: 0.9, CHN: 1.6, RUS: 2.0 }, ea: 1.5 },
    us: { label: 'US-centred financial shock', mult: { Americas: 1.3, 'Euro area': 0.8, Europe: 0.8, 'Asia-Pacific': 0.8, Africa: 0.6 }, iso: { USA: 1.4, CAN: 1.2, MEX: 1.2 }, ea: 0.8 }
  };
  const PRESETS = [
    { id: 'live', icon: '◉', name: ['Status quo (live)', 'Τρέχουσα κατάσταση (ζωντανά)'], brent: null, war: 0, dNfci: 0, dVix: 0, dRate: 0, region: 'none', src: 'Live Brent. Hormuz effectively closed since the US–Israel war on Iran began on 28 Feb 2026; the IMF baseline assumes reopening by Mar 2027.', tag: 'LIVE' },
    { id: 'reopen', icon: '⚓', name: ['Hormuz reopens', 'Άνοιγμα Ορμούζ'], brent: 75, war: 0, dNfci: -0.1, dVix: -3, dRate: -0.25, region: 'none', src: 'Brent back near its pre-war ≈$72 level; slight easing of financial conditions.', tag: 'SCENARIO' },
    { id: 'gulf', icon: '🔥', name: ['Gulf escalation · $150', 'Κλιμάκωση στον Κόλπο · $150'], brent: 150, war: -0.3, dNfci: 0.4, dVix: 10, dRate: 0.25, region: 'gulf', src: 'Bypass pipelines (East–West to Yanbu) knocked out, ship-to-ship transfers stop. Extra −0.3pp for shipping/LNG/insurance: the IMF (Oct 2026) puts the net effect of a closure at −0.3pp after offsets, −0.9pp without them.', tag: 'SCENARIO' },
    { id: 'oil200', icon: '⛽', name: ['1979-style oil shock · $200', 'Πετρελαϊκό σοκ τύπου 1979 · $200'], brent: 200, war: -0.5, dNfci: 0.8, dVix: 15, dRate: 0.5, region: 'gulf', src: 'Loss of most Gulf exports for months; central banks lean against second-round inflation (IMF: >6% global inflation in its severe case).', tag: 'SCENARIO' },
    { id: 'nato', icon: '⚔', name: ['Russia–NATO clash', 'Σύγκρουση Ρωσίας–ΝΑΤΟ'], brent: '+25', war: -1.0, dNfci: 1.0, dVix: 20, dRate: 0, region: 'europe', src: 'Limited direct clash on NATO’s eastern flank; European gas and oil spike. No published global-GDP estimate — size is ILLUSTRATIVE.', tag: 'ILLUSTRATIVE' },
    { id: 'blockade', icon: '⛴', name: ['China blockades Taiwan', 'Αποκλεισμός Ταϊβάν από Κίνα'], brent: '+10', war: -5.0, dNfci: 1.5, dVix: 25, dRate: -0.5, region: 'asia', src: 'Bloomberg Economics (Jan 2024): blockade costs ≈5% of world GDP (Taiwan −12.2%, China −8.9%, US −3.3%), with allied sanctions on China.', tag: 'PUBLISHED' },
    { id: 'uscn', icon: '✸', name: ['US–China war over Taiwan', 'Πόλεμος ΗΠΑ–Κίνας για Ταϊβάν'], brent: '+40', war: -10.2, dNfci: 3.0, dVix: 45, dRate: -1.5, region: 'asia', src: 'Bloomberg Economics (Jan 2024): war costs ≈$10tn, ≈10% of world GDP (Taiwan ≈−40%, China −16.7%, US −6.7%). Financial stress set near the 2008 peak.', tag: 'PUBLISHED' },
    { id: 'ww3', icon: '☢', name: ['World War III (conventional)', 'Γ’ Παγκόσμιος (συμβατικός)'], brent: 250, war: -15, dNfci: 4.5, dVix: 60, dRate: -2.0, region: 'global', src: 'Simultaneous Indo-Pacific and European great-power war. No credible published estimate exists; −15% is ILLUSTRATIVE and outside every model’s support. A nuclear exchange is not modelled — its costs are not meaningfully quantifiable.', tag: 'ILLUSTRATIVE' },
    { id: 'ai', icon: '⌁', name: ['AI / equity bust', 'Κατάρρευση AI / μετοχών'], brent: '-10', war: -0.8, dNfci: 1.2, dVix: 20, dRate: -1.0, region: 'us', src: 'IMF (Oct 2026) lists a sharp correction in AI investment as a key downside risk. Size ILLUSTRATIVE (≈ 2000–02 dot-com: NFCI +1.2, US capex collapse).', tag: 'ILLUSTRATIVE' }
  ];

  const L = { geo: null, geoErr: null, preset: 'live', p: null, chart: {}, geoJson: null, mcSeed: 1 };

  /* ---------------- data ---------------- */
  async function loadGeo() {
    try { const r = await fetch('/api/geo'); const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch (_) { throw new Error('HTTP ' + r.status); } if (!r.ok) throw new Error(j.message || r.status); L.geo = j; }
    catch (e) { L.geoErr = e.message; }
    renderGeo();
    if (L.geo) loadNews();
  }
  // GDELT flashpoints arrive one by one (each call ≈10 s uncached, then edge-cached for 6 h)
  async function loadNews() {
    const fps = L.geo.flashpoints || []; L.geo.news = fps.map(f => ({ id: f.id, label: f.label, error: T('loading…', 'φόρτωση…') })); renderGeo();
    for (const f of fps) {
      try { const r = await fetch('/api/news?id=' + f.id); const j = await r.json(); const k = L.geo.news.findIndex(n => n.id === f.id); L.geo.news[k] = Object.assign({ label: f.label }, j); }
      catch (e) { const k = L.geo.news.findIndex(n => n.id === f.id); L.geo.news[k] = { id: f.id, label: f.label, error: e.message }; }
      recomputeEscalation(); renderGeo();
    }
  }
  function recomputeEscalation() {
    const E = L.geo.escalation; if (!E) return;
    const nn = L.geo.news.filter(n => n.ratio != null); E.parts = E.parts.filter(p => p.id !== 'news');
    if (nn.length) { const top = nn.filter(n => ['ww3', 'nuclear', 'taiwan', 'nato'].includes(n.id)); const arr = (top.length ? top : nn).map(n => n.ratio); const r = arr.reduce((a, b) => a + b, 0) / arr.length; E.parts.splice(1, 0, { id: 'news', label: 'Great-power flashpoint news intensity (7d vs 90d median)', value: Math.round(r * 100) / 100, score: Math.round(clamp(50 + 50 * Math.log2(r), 0, 100)), weight: 0.2 }); }
    const w = E.parts.reduce((a, p) => a + p.weight, 0); E.value = w ? Math.round(E.parts.reduce((a, p) => a + p.weight * p.score, 0) / w) : null; E.coverage = w;
  }
  async function ensureRadar() {
    const R = window.FaultlineRadar; if (!R) return null;
    if (!R.data) await R.load(false);
    return R.data;
  }

  /* ---------------- engine ---------------- */
  function liveBrent(d) { const s = (d.signals || []).find(x => x.id === 'DCOILBRENTEU'); return s ? s.value : (L.geo && L.geo.brent ? L.geo.brent.last.value : 95); }
  function resolveBrent(p, live) { if (p.brent == null) return live; if (typeof p.brent === 'string') return live + Number(p.brent); return p.brent; }
  function growthAt(brent, war, slope, base) { return (base ?? CAL.baseGrowth) - (slope ?? CAL.oilSlope) * (brent - CAL.baseOil) + war; }
  function logitP(d, spread, min24, nfci) {
    const m = d.us.model; const x = { spread, spreadMin24: min24, nfci };
    let z = m.beta[0]; m.vars.forEach((v, j) => { z += m.beta[j + 1] * (x[v.id] - m.mean[j]) / m.sd[j]; }); return 100 / (1 + Math.exp(-z));
  }
  function diffRegression(d) {
    const rows = d.history.rows.filter(r => r[0] >= '1985-01' && r[5] != null && r[6] != null);
    const xs = rows.map(r => r[5]), ys = rows.map(r => r[6]); const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
    let n = 0, dd = 0; xs.forEach((x, i) => { n += (x - mx) * (ys[i] - my); dd += (x - mx) ** 2; }); return { b: n / dd, a: my - (n / dd) * mx, n: rows.length };
  }
  function scenario(d, p) {
    const live = liveBrent(d); const brent = p.brentOverride ?? resolveBrent(p, live);
    const gLive = growthAt(live, 0), g = growthAt(brent, p.war);
    const C = Object.fromEntries(d.us.contributions.map(c => [c.id, c.value]));
    const dSpread = CAL.spreadPerRate * p.dRate;
    const spread = C.spread + dSpread, min24 = Math.min(C.spreadMin24, spread), nfci = C.nfci + p.dNfci;
    const P0 = logitP(d, C.spread, C.spreadMin24, C.nfci), P1 = logitP(d, spread, min24, nfci);
    // stress: shift each component and re-scale to % of the 2008 peak
    const comp = d.stress.us.components; const byId = Object.fromEntries(comp.map(c => [c.id, c]));
    const nf = byId.NFCI, stScale = byId.STLFSI4 && nf ? (byId.STLFSI4.gfcPeak - byId.STLFSI4.baseline) / (nf.gfcPeak - nf.baseline) : 1;
    const shift = { NFCI: p.dNfci, BAA10YM: CAL.baaPerNfci * p.dNfci, VIXCLS: p.dVix, STLFSI4: p.dNfci * stScale };
    const sc = c => (c.value == null ? null : 100 * (c.value + (shift[c.id] || 0) - c.baseline) / (c.gfcPeak - c.baseline));
    const usS = comp.map(sc).filter(v => v != null); const S_us = usS.reduce((a, b) => a + b, 0) / usS.length;
    const prof = REGION_PROFILE[p.region] || REGION_PROFILE.none;
    const S_ea = d.stress.ea.current == null ? null : d.stress.ea.current + (S_us - (d.stress.us.current ?? 0)) * (prof.ea || 1);
    const g20 = d.global.g20.value == null ? null : d.global.g20.value + CAL.cliPerPp * (g - gLive);
    const reg = diffRegression(d); const diffNow = d.global.diffusion.value;
    const diff = diffNow == null || g20 == null ? null : clamp(diffNow + reg.b * (g20 - d.global.g20.value), 0, 100);
    // countries
    const ex = (window.FaultlineRadar && window.FaultlineRadar.extra) || {};
    const oilHitWorld = -CAL.oilSlope * (brent - live);
    const rows = [];
    const seen = new Set();
    const pushC = (iso3, name, region, scoreNow) => {
      if (seen.has(iso3)) return; seen.add(iso3);
      const eImp = ex[iso3] && ex[iso3]['EG.IMP.CONS.ZS'] ? ex[iso3]['EG.IMP.CONS.ZS'].v : null;
      const open = ex[iso3] && ex[iso3]['NE.EXP.GNFS.ZS'] ? ex[iso3]['NE.EXP.GNFS.ZS'].v : null;
      const oilBeta = eImp == null ? 1 : clamp(1 + 1.2 * clamp(eImp, -200, 100) / 100, -1.5, 2.5);
      const regMult = (prof.iso && prof.iso[iso3]) || (prof.mult && prof.mult[region]) || 1;
      const openMult = open == null ? 1 : clamp(0.7 + open / 100, 0.7, 1.6);
      const dOil = oilHitWorld * oilBeta, dWar = p.war * regMult * (p.region === 'none' ? 1 : 1) * (p.war ? openMult : 1);
      const dG = dOil + dWar;
      const sNew = scoreNow == null ? null : clamp(scoreNow + 10 * Math.max(0, -dG) - 4 * Math.max(0, dG), 0, 100);
      rows.push({ iso3, name, region, dOil, dWar, dG, scoreNow, scoreNew: sNew, level: sNew == null ? (dG <= -2 ? 'red' : dG <= -1 ? 'amber' : 'green') : sNew >= 60 ? 'red' : sNew >= 40 ? 'amber' : 'green', eImp, open });
    };
    d.countries.forEach(c => pushC(c.iso3, c.name, c.region, c.score));
    const regionOf = r => (/Europe/.test(r || '') ? 'Europe' : /Asia|Pacific/.test(r || '') ? 'Asia-Pacific' : /America/.test(r || '') ? 'Americas' : /Africa|Middle East/.test(r || '') ? 'Africa' : 'Other');
    ((window.FaultlineSVI && window.FaultlineSVI.countries) || []).forEach(c => { if (ex[c.id]) pushC(c.id, c.name, regionOf(c.region), null); });
    rows.sort((a, b) => a.dG - b.dG);
    const red = rows.filter(r => r.scoreNew != null && r.level === 'red').map(r => r.iso3), amber = rows.filter(r => r.scoreNew != null && r.level === 'amber').map(r => r.iso3);
    const core = window.FaultlineRadarCore;
    const v = core && core.verdict ? core.verdict({ P: P1, Sus: S_us, Sea: S_ea, g20, g20ch6: (d.global.g20.change6m || 0) + (g20 - d.global.g20.value), diff, red, amber }) : null;
    return { brent, live, g, gLive, P0, P1, spread, nfci, S_us, S_ea, S: Math.max(S_us, S_ea ?? -999), g20, diff, rows, verdict: v, regB: reg.b, dSpread };
  }
  function monteCarlo(d, p, n) {
    let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const live = liveBrent(d), brent = p.brentOverride ?? resolveBrent(p, live); const out = [];
    for (let i = 0; i < n; i++) {
      const slope = Math.max(0.005, CAL.oilSlope + CAL.oilSlopeSd * gauss());
      const warM = Math.exp(0.35 * gauss());              // ±35% (log) on the size of war/shock hits
      const base = CAL.baseGrowth + 0.3 * gauss();        // IMF forecast error, roughly 0.3pp 1y ahead in calm years
      const b = brent * Math.exp(0.15 * gauss());          // oil path uncertainty around the scenario level
      out.push(growthAt(b, p.war * warM, slope, base));
    }
    out.sort((a, b) => a - b);
    const pr = th => 100 * out.filter(x => x < th).length / n; const q = k => out[Math.floor(k * (n - 1))];
    return { draws: out, p2: pr(2.0), p1: pr(1.0), p0: pr(0), q05: q(0.05), q50: q(0.5), q95: q(0.95) };
  }

  /* ---------------- render ---------------- */
  function show() {
    const root = $('lab-root'); if (!root) return;
    if (!root.dataset.ready) {
      root.dataset.ready = '1';
      root.innerHTML = '<section class="panel lab-geo" id="lab-geo"><div class="rd-loading"><div class="orbit"></div>' + T('Reading the Geopolitical Risk index, GDELT and oil markets…', 'Ανάγνωση Geopolitical Risk index, GDELT και αγορών πετρελαίου…') + '</div></section><div id="lab-main"><div class="rd-loading"><div class="orbit"></div>' + T('Loading the radar baseline…', 'Φόρτωση βάσης από το ραντάρ…') + '</div></div>';
      loadGeo();
    }
    ensureRadar().then(d => { if (d) renderLab(d); });
  }
  function renderGeo() {
    const box = $('lab-geo'); if (!box) return; const g = L.geo;
    if (!g) { box.innerHTML = '<div class="rd-error">' + T('Escalation layer unavailable: ', 'Το επίπεδο κλιμάκωσης δεν είναι διαθέσιμο: ') + esc(L.geoErr) + '</div>'; return; }
    const E = g.escalation, v = E.value; const band = E.bands.filter(b => v != null && v >= b[0]).pop();
    const tone = v == null ? 'na' : v >= 65 ? 'red' : v >= 45 ? 'amber' : 'green';
    const parts = E.parts.map(pp => '<div class="lab-part"><span>' + esc(pp.label) + '</span><div class="rd-gauge"><i style="width:' + Math.max(2, pp.score) + '%"></i></div><b>' + pp.score + '</b><small>' + (pp.id === 'gpr' ? num(pp.value, 0) + '% of WWII' : pp.id === 'news' ? '×' + num(pp.value, 2) : pp.id === 'clock' ? pp.value + ' s' : sgn(pp.value, 0) + '%') + ' · w ' + pp.weight + '</small></div>').join('');
    const gp = g.gpr; const marks = gp ? gp.marks : [];
    const news = (g.news || []).map(n => '<tr><td>' + esc(n.label) + '</td><td class="mono">' + (n.ratio == null ? '<span class="c-mute">' + esc(n.error || '—') + '</span>' : '<span class="' + (n.ratio >= 1.5 ? 'c-red' : n.ratio >= 1.1 ? 'c-amber' : 'c-green') + '">×' + num(n.ratio, 2) + '</span>') + '</td><td>' + spark(n.spark) + '</td></tr>').join('');
    box.innerHTML = '<div class="panel-head"><div><div class="micro-label">' + T('ESCALATION INDEX · GPR · GDELT · DOOMSDAY CLOCK · OIL WAR PREMIUM', 'ΔΕΙΚΤΗΣ ΚΛΙΜΑΚΩΣΗΣ · GPR · GDELT · DOOMSDAY CLOCK · ΠΟΛΕΜΙΚΟ ΑΣΦΑΛΙΣΤΡΟ ΠΕΤΡΕΛΑΙΟΥ') + '</div><h2 class="lab-title">' + T('How close are we to World War III?', 'Πόσο κοντά είμαστε σε Γ’ Παγκόσμιο;') + '</h2></div><span class="panel-hint">' + esc((g.generatedAt || '').slice(0, 16).replace('T', ' ')) + ' UTC</span></div>' +
      '<div class="lab-geo-grid"><div class="lab-geo-big" data-tone="' + tone + '"><div class="rd-ring" style="--v:' + (v ?? 0) + '"><span>' + (v ?? '—') + '<small>/100</small></span></div><b>' + esc(band ? band[1] : '—') + '</b><p>' + T('Escalation intensity relative to history — <u>not</u> a probability of world war. No model can estimate that probability from data: there have been two world wars.', 'Ένταση κλιμάκωσης σε σχέση με την ιστορία — <u>όχι</u> πιθανότητα παγκοσμίου πολέμου. Κανένα μοντέλο δεν μπορεί να την εκτιμήσει από δεδομένα: έχουν γίνει μόνο δύο παγκόσμιοι πόλεμοι.') + '</p></div>' +
      '<div><h4 class="rd-h4">' + T('COMPONENTS (0–100)', 'ΣΥΝΙΣΤΩΣΕΣ (0–100)') + '</h4>' + parts +
      '<div class="lab-facts"><div><span>GPR (Caldara–Iacoviello)</span><b>' + (gp && gp.latest ? num(gp.latest.gprh, 0) : '—') + '</b><small>' + (gp && gp.latest ? esc(gp.latest.month) + ' · ' + num(gp.percentileSince1900, 0) + T('th percentile since 1900', 'ο εκατοστημόριο από το 1900') : esc(g.sources.gprMonthly)) + '</small></div>' +
      '<div><span>' + T('Daily GPR, 7-day avg', 'Ημερήσιο GPR, μ.ό. 7 ημ.') + '</span><b>' + (g.gprDaily ? num(g.gprDaily.avg7, 0) : '—') + '</b><small>' + (g.gprDaily ? T('1-yr median ', 'διάμεσος έτους ') + num(g.gprDaily.median365, 0) : esc(g.sources.gprDaily)) + '</small></div>' +
      '<div><span>Doomsday Clock</span><b>' + g.doomsday.seconds + ' s</b><small>' + T('closest ever · set ', 'το πιο κοντά ever · ') + esc(g.doomsday.set) + '</small></div>' +
      '<div><span>Brent ' + T('war premium', 'πολεμικό ασφάλιστρο') + '</span><b>' + (g.brent ? sgn(g.brent.premiumPct, 0) + '%' : '—') + '</b><small>' + (g.brent ? '$' + num(g.brent.last.value, 1) + ' vs $' + num(g.brent.prewar, 1) + T(' pre-war', ' προ πολέμου') : '') + '</small></div></div></div>' +
      '<div><h4 class="rd-h4">' + T('FLASHPOINT NEWS INTENSITY (GDELT, 7d vs 90d)', 'ΕΝΤΑΣΗ ΕΙΔΗΣΕΩΝ ΑΝΑ ΕΣΤΙΑ (GDELT, 7ημ vs 90ημ)') + '</h4><table class="rd-table lab-news"><tbody>' + news + '</tbody></table></div></div>' +
      '<div id="lab-gpr" class="rd-chart"></div><div class="rd-legend">' + marks.map(m => '<span>' + esc(m.name) + ' · ' + m.gprh + '</span>').join('') + '</div>' +
      '<p class="fineprint">' + T('E = 0.35·min(100, GPRH as % of WWII peak) + 0.20·news(50 + 50·log₂ ratio) + 0.20·100·(1 − ln s / ln 1020) + 0.25·min(100, Brent premium / 1.5). GPR counts newspaper articles about geopolitical tensions (Caldara & Iacoviello, AER 2022); GPRH runs from 1900 so today can be compared with the world wars, Korea, Cuba and 9/11. Weights are declared choices.', 'E = 0.35·min(100, GPRH ως % της κορύφωσης του Β’ ΠΠ) + 0.20·ειδήσεις(50 + 50·log₂ λόγου) + 0.20·100·(1 − ln s / ln 1020) + 0.25·min(100, ασφάλιστρο Brent / 1.5). Το GPR μετρά άρθρα εφημερίδων για γεωπολιτικές εντάσεις (Caldara & Iacoviello, AER 2022)· το GPRH ξεκινά το 1900, άρα το σήμερα συγκρίνεται με τους παγκόσμιους πολέμους, την Κορέα, την Κούβα και την 11η Σεπτεμβρίου. Τα βάρη είναι δηλωμένες επιλογές.') + '</p>';
    drawGpr();
  }
  function spark(a) { const v = (a || []).filter(Number.isFinite); if (v.length < 3) return ''; const mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1; return '<svg viewBox="0 0 100 24" preserveAspectRatio="none" class="lab-spark"><polyline points="' + a.map((x, i) => (i / (a.length - 1) * 100).toFixed(1) + ',' + (22 - (x - mn) / rg * 20).toFixed(1)).join(' ') + '" fill="none" stroke="#f5c869" stroke-width="1.3" vector-effect="non-scaling-stroke"/></svg>'; }
  function chart(id) { const e = $(id); if (!e || typeof echarts === 'undefined') return null; if (L.chart[id]) L.chart[id].dispose(); L.chart[id] = echarts.init(e); return L.chart[id]; }
  const TT = { backgroundColor: '#0e1222', borderColor: '#3b4370', textStyle: { color: '#eef1ff', fontSize: 11 } };
  function drawGpr() {
    const g = L.geo; if (!g || !g.gpr) return; const c = chart('lab-gpr'); if (!c) return;
    const s = g.gpr.series; const marks = g.gpr.marks;
    c.setOption({ backgroundColor: 'transparent', grid: { left: 46, right: 16, top: 24, bottom: 48 }, tooltip: Object.assign({ trigger: 'axis' }, TT),
      xAxis: { type: 'category', data: s.map(x => x[0]), boundaryGap: false, axisLabel: { color: '#8b93b8', fontSize: 10 }, axisLine: { lineStyle: { color: '#252b45' } } },
      yAxis: { type: 'value', axisLabel: { color: '#8b93b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#1b2036', type: 'dashed' } } },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 14, bottom: 8, borderColor: '#252b45', fillerColor: 'rgba(245,200,105,.12)', textStyle: { color: '#8b93b8' } }],
      series: [{ name: 'GPRH (1900–)', type: 'line', data: s.map(x => x[1]), showSymbol: false, lineStyle: { color: '#f5c869', width: 1.2 }, areaStyle: { color: 'rgba(245,200,105,.10)' },
        markPoint: { symbol: 'pin', symbolSize: 30, itemStyle: { color: '#f43f5e' }, label: { fontSize: 8, color: '#fff', formatter: p => p.name.split(' ')[0] }, data: marks.map(m => ({ name: m.name, coord: [m.month, m.gprh], value: m.gprh })) } }] });
  }

  function presetById(id) { return PRESETS.find(p => p.id === id) || PRESETS[0]; }
  function currentParams() {
    const p = Object.assign({}, presetById(L.preset));
    const g = id => { const e = $(id); return e ? Number(e.value) : null; };
    if ($('lab-brent')) { p.brentOverride = g('lab-brent'); p.war = g('lab-war'); p.dNfci = g('lab-nfci'); p.dVix = g('lab-vix'); p.dRate = g('lab-rate'); p.region = $('lab-region').value; }
    return p;
  }
  function renderLab(d) {
    const main = $('lab-main'); if (!main) return;
    const live = liveBrent(d); const p0 = presetById(L.preset); const b0 = resolveBrent(p0, live);
    const presetCards = PRESETS.map(p => '<button class="lab-preset' + (p.id === L.preset ? ' on' : '') + '" data-preset="' + p.id + '"><span class="ic">' + p.icon + '</span><b>' + esc(el() ? p.name[1] : p.name[0]) + '</b><em class="tag-' + p.tag.toLowerCase() + '">' + p.tag + '</em></button>').join('');
    const slider = (id, label, min, max, step, val, unit, hint) => '<label class="lab-slider"><span>' + label + '<b id="' + id + '-v">' + val + unit + '</b></span><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" data-unit="' + unit + '"/><small>' + hint + '</small></label>';
    main.innerHTML = '<section class="panel"><div class="panel-head"><div><div class="micro-label">' + T('SCENARIO PRESETS · BASED ON TODAY’S LIVE DATA', 'ΕΤΟΙΜΑ ΣΕΝΑΡΙΑ · ΠΑΝΩ ΣΤΑ ΣΗΜΕΡΙΝΑ ΖΩΝΤΑΝΑ ΔΕΔΟΜΕΝΑ') + '</div><h2 class="lab-title">' + T('Choose a shock — or build your own', 'Διάλεξε σοκ — ή φτιάξε το δικό σου') + '</h2></div></div><div class="lab-presets" id="lab-presets">' + presetCards + '</div>' +
      '<div class="lab-src" id="lab-src"></div>' +
      '<div class="lab-controls">' +
      slider('lab-brent', 'Brent', 40, 300, 1, Math.round(b0), '$', T('live $', 'ζωντανά $') + num(live, 1) + ' · IMF 2027 $87.4') +
      slider('lab-war', T('War / disruption shock to world GDP', 'Σοκ πολέμου/διακοπής στο παγκόσμιο ΑΕΠ'), -20, 0, 0.1, p0.war, 'pp', T('Bloomberg Econ.: blockade −5, US–China war −10.2', 'Bloomberg Econ.: αποκλεισμός −5, πόλεμος ΗΠΑ–Κίνας −10.2')) +
      slider('lab-nfci', T('Financial conditions shock (ΔNFCI)', 'Σοκ χρηματοπιστωτικών συνθηκών (ΔNFCI)'), -0.5, 5, 0.1, p0.dNfci, '', T('2008: +3.5 · 2020: +1.0 · 2022: +0.6', '2008: +3.5 · 2020: +1.0 · 2022: +0.6')) +
      slider('lab-vix', T('Volatility shock (ΔVIX)', 'Σοκ μεταβλητότητας (ΔVIX)'), -10, 70, 1, p0.dVix, '', T('VIX now ', 'VIX τώρα ') + num(((d.signals.find(s => s.id === 'VIXCLS') || {}).value), 1)) +
      slider('lab-rate', T('Central-bank policy-rate response', 'Αντίδραση επιτοκίου κεντρικής τράπεζας'), -3, 3, 0.25, p0.dRate, 'pp', T('hikes flatten the curve: Δspread = −0.6·Δrate', 'αυξήσεις → πιο επίπεδη καμπύλη: Δspread = −0.6·Δrate')) +
      '<label class="lab-slider"><span>' + T('Where the war shock lands', 'Πού «χτυπά» το σοκ') + '</span><select id="lab-region">' + Object.entries(REGION_PROFILE).map(([k, v]) => '<option value="' + k + '"' + (k === p0.region ? ' selected' : '') + '>' + esc(v.label) + '</option>').join('') + '</select><small>' + T('country multipliers by region', 'πολλαπλασιαστές ανά περιοχή') + '</small></label>' +
      '</div></section>' +
      '<div id="lab-out"></div>';
    $('lab-presets').addEventListener('click', e => { const b = e.target.closest('[data-preset]'); if (!b) return; L.preset = b.dataset.preset; renderLab(d); });
    main.querySelectorAll('input[type=range],select').forEach(i => i.addEventListener('input', () => { const v = $(i.id + '-v'); if (v) v.textContent = (i.id === 'lab-brent' ? '$' : '') + (i.id === 'lab-brent' ? i.value : (Number(i.value) > 0 && i.id !== 'lab-brent' ? '+' : '') + i.value + (i.dataset.unit || '')); compute(d); }));
    ['lab-brent'].forEach(id => { const v = $(id + '-v'); v.textContent = '$' + $(id).value; });
    $('lab-src').innerHTML = '<b>' + esc(el() ? p0.name[1] : p0.name[0]) + '</b> — ' + esc(p0.src);
    compute(d);
  }

  function compute(d) {
    const p = currentParams(); const base = scenario(d, Object.assign({}, presetById('live'), { brentOverride: liveBrent(d) })); const s = scenario(d, p); const mc = monteCarlo(d, p, 4000);
    const out = $('lab-out'); if (!out) return;
    const R = window.FaultlineRadar && window.FaultlineRadar.data; const regimes = { EXPANSION: T('Expansion', 'Επέκταση'), LOCAL: T('Local recessions', 'Τοπικές υφέσεις'), LATE_CYCLE: T('Late cycle', 'Ώριμη φάση'), GLOBAL_SLOWDOWN: T('Global slowdown', 'Παγκόσμια επιβράδυνση'), SYSTEMIC_WATCH: T('Stress building', 'Συσσώρευση πίεσης'), GLOBAL_RECESSION: T('Global recession', 'Παγκόσμια ύφεση'), SYSTEMIC: T('Systemic crisis (2008-type)', 'Συστημική κρίση (τύπου 2008)') };
    const tone = c => ({ EXPANSION: 'green', LOCAL: 'green', LATE_CYCLE: 'amber', GLOBAL_SLOWDOWN: 'amber', SYSTEMIC_WATCH: 'amber', GLOBAL_RECESSION: 'red', SYSTEMIC: 'red' }[c] || 'amber');
    const kpi = (label, a, b, unit, dec, worseUp, note) => { const dlt = (b ?? 0) - (a ?? 0); const bad = worseUp ? dlt > 0.05 : dlt < -0.05; const good = worseUp ? dlt < -0.05 : dlt > 0.05; return '<div class="lab-kpi"><span>' + label + '</span><div><em>' + num(a, dec) + unit + '</em><i>→</i><b class="' + (bad ? 'c-red' : good ? 'c-green' : '') + '">' + num(b, dec) + unit + '</b></div><small>' + (note || '') + '</small></div>'; };
    const g = s.g; const gTone = g < 0 ? 'red' : g < 1 ? 'red' : g < 2 ? 'amber' : 'green';
    const prox = (x, calm, trig) => (x == null ? null : clamp(100 * (x - calm) / (trig - calm), 0, 100));
    const alarm = R && R.verdict.answers.us.alarmThreshold || 50;
    const pi = v => [prox(v.P1, 5, alarm), prox(v.g20, 101, 98.8), prox(v.diff, 0, 60), prox(v.S, 0, 60)].filter(x => x != null);
    const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const PI0 = avg(pi(base)), PI1 = avg(pi(s));
    const breakeven = th => CAL.baseOil + (CAL.baseGrowth + (s.g - growthAt(s.brent, 0) ) - th) / CAL.oilSlope; // Brent at which growth hits th, given the chosen war shock
    const hist = (() => { const lo = Math.floor(Math.min(mc.draws[Math.floor(mc.draws.length * 0.005)], -0.5) * 2) / 2 - 0.5, hi = Math.ceil(Math.max(mc.draws[Math.floor(mc.draws.length * 0.995)], 2.5) * 2) / 2 + 0.5; const step = Math.max(0.1, Math.round((hi - lo) / 40 * 10) / 10); const bins = []; for (let x = lo; x <= hi + 1e-9; x += step) bins.push([Math.round(x * 10) / 10, 0]); mc.draws.forEach(v => { const k = clamp(Math.floor((v - lo) / step), 0, bins.length - 1); bins[k][1]++; }); return bins; })();
    out.innerHTML = '<section class="panel lab-result" data-tone="' + gTone + '"><div class="panel-head"><div><div class="micro-label">' + T('SCENARIO RESULT · 12-MONTH HORIZON', 'ΑΠΟΤΕΛΕΣΜΑ ΣΕΝΑΡΙΟΥ · ΟΡΙΖΟΝΤΑΣ 12 ΜΗΝΩΝ') + '</div><h2 class="lab-title">' + T('World growth ', 'Παγκόσμια ανάπτυξη ') + '<span class="c-' + gTone + '">' + num(g, 1) + '%</span> · ' + T('regime: ', 'καθεστώς: ') + '<span class="c-' + tone(s.verdict && s.verdict.code) + '">' + esc(s.verdict ? regimes[s.verdict.code] : '—') + '</span></h2></div><span class="panel-hint">' + T('vs status quo ', 'έναντι τρέχουσας ') + num(base.g, 1) + '% · ' + esc(base.verdict ? regimes[base.verdict.code] : '') + '</span></div>' +
      '<div class="lab-kpis">' +
      kpi(T('World GDP growth', 'Παγκόσμιο ΑΕΠ'), base.g, s.g, '%', 1, false, T('IMF Oct 2026 base 3.4% at $87', 'ΔΝΤ Οκτ. 2026: 3.4% με $87')) +
      kpi(T('US recession prob. (12m)', 'Πιθ. ύφεσης ΗΠΑ (12μ)'), base.P1, s.P1, '%', 0, true, T('fitted logit · alarm ', 'logit · συναγερμός ') + alarm + '%') +
      kpi(T('Financial stress (% of 2008)', 'Χρημ. πίεση (% του 2008)'), base.S, s.S, '%', 0, true, 'US ' + num(s.S_us, 0) + ' · EA ' + num(s.S_ea, 0)) +
      kpi('G20 CLI', base.g20, s.g20, '', 2, false, T('global recession < 98.8', 'παγκόσμια ύφεση < 98.8')) +
      kpi(T('Downturn diffusion', 'Διάχυση συρρίκνωσης'), base.diff, s.diff, '%', 0, true, T('synchronised ≥ 60%', 'συγχρονισμένη ≥ 60%')) +
      kpi(T('Recession proximity', 'Εγγύτητα ύφεσης'), PI0, PI1, '/100', 0, true, T('mean of 4 pillars', 'μ.ό. 4 πυλώνων')) +
      '</div>' +
      '<div class="lab-two"><div><h4 class="rd-h4">' + T('MONTE CARLO · 4,000 DRAWS OF PARAMETER UNCERTAINTY', 'MONTE CARLO · 4.000 ΚΛΗΡΩΣΕΙΣ ΑΒΕΒΑΙΟΤΗΤΑΣ ΠΑΡΑΜΕΤΡΩΝ') + '</h4><div id="lab-mc" class="rd-chart" style="height:250px"></div>' +
      '<div class="lab-probs"><div><span>P(g &lt; 2.0%)</span><b class="' + (mc.p2 > 50 ? 'c-red' : mc.p2 > 20 ? 'c-amber' : 'c-green') + '">' + num(mc.p2, 0) + '%</b><small>' + T('IMF "close call"', 'ΔΝΤ «οριακά»') + '</small></div><div><span>P(g &lt; 1.0%)</span><b class="' + (mc.p1 > 50 ? 'c-red' : mc.p1 > 20 ? 'c-amber' : 'c-green') + '">' + num(mc.p1, 0) + '%</b><small>' + T('global recession', 'παγκόσμια ύφεση') + '</small></div><div><span>P(g &lt; 0)</span><b class="' + (mc.p0 > 50 ? 'c-red' : mc.p0 > 20 ? 'c-amber' : 'c-green') + '">' + num(mc.p0, 0) + '%</b><small>' + T('world output falls', 'πτώση παγκόσμιου προϊόντος') + '</small></div><div><span>90% ' + T('range', 'εύρος') + '</span><b>' + num(mc.q05, 1) + ' … ' + num(mc.q95, 1) + '%</b><small>' + T('median ', 'διάμεσος ') + num(mc.q50, 1) + '%</small></div></div>' +
      '<p class="fineprint">' + T('These are probabilities conditional on the scenario and on the stated parameter ranges (oil slope ±0.010 pp/$, war-hit size ±35%, IMF base ±0.3pp, oil path ±15%), not unconditional forecasts.', 'Πιθανότητες υπό την προϋπόθεση του σεναρίου και των δηλωμένων ευρών παραμέτρων (κλίση πετρελαίου ±0.010 μ.β./$, μέγεθος σοκ ±35%, βάση ΔΝΤ ±0.3 μ.β., πορεία πετρελαίου ±15%) — όχι άνευ όρων προβλέψεις.') + '</p></div>' +
      '<div><h4 class="rd-h4">' + T('THE TRANSMISSION, STEP BY STEP', 'Η ΜΕΤΑΔΟΣΗ, ΒΗΜΑ-ΒΗΜΑ') + '</h4><div class="equation lab-eq">' +
      'g = 3.4 − 0.039·(Brent − 87.4) + war<br/>&nbsp;&nbsp;= 3.4 − 0.039·(' + num(s.brent, 0) + ' − 87.4) ' + (currentParams().war < 0 ? '− ' + num(-currentParams().war, 1) : '+ 0') + ' = <b>' + num(s.g, 2) + '%</b><br/><br/>' +
      'CLI′ = CLI + 1.4·(g − g<sub>live</sub>) = ' + num(R.global.g20.value, 2) + ' + 1.4·(' + num(s.g - s.gLive, 2) + ') = <b>' + num(s.g20, 2) + '</b><br/>' +
      'D′ = D + ' + num(s.regB, 1) + '·ΔCLI = <b>' + num(s.diff, 0) + '%</b> <small>(OLS 1985–, ' + T('slope from history', 'κλίση από την ιστορία') + ')</small><br/><br/>' +
      'spread′ = spread − 0.6·Δrate = <b>' + num(s.spread, 2) + '</b> · NFCI′ = <b>' + num(s.nfci, 2) + '</b><br/>' +
      'P′ = σ(β·z(spread′, min₂₄′, NFCI′)) = <b>' + num(s.P1, 1) + '%</b><br/>' +
      'S′<sub>k</sub> = 100·(x<sub>k</sub>+Δ<sub>k</sub> − m<sub>k</sub>)/(peak<sub>k</sub> − m<sub>k</sub>) → S′ = <b>' + num(s.S, 0) + '%</b></div>' +
      '<h4 class="rd-h4" style="margin-top:14px">' + T('BREAK-EVEN — HOW FAR FROM THE LINE?', 'ΣΗΜΕΙΑ ΘΡΑΥΣΗΣ — ΠΟΣΟ ΑΠΕΧΟΥΜΕ;') + '</h4>' +
      CAL.thresholds.map(([th, lab]) => { const be = breakeven(th); return '<div class="rd-kv"><span>' + T('Brent for g = ', 'Brent για g = ') + th.toFixed(1) + '% <small class="c-mute">(' + esc(lab) + ')</small></span><b>' + (be > 400 ? '> $400' : be < 0 ? T('already below', 'ήδη κάτω') : '$' + num(be, 0)) + '</b></div>'; }).join('') +
      '<div class="rd-kv"><span>' + T('War shock alone for g < 2.0% at live oil', 'Μόνο σοκ πολέμου για g < 2.0% με τρέχον πετρέλαιο') + '</span><b>' + sgn(Math.min(0, 2.0 - base.g), 1) + 'pp</b></div>' +
      '</div></div></section>' +
      '<section class="panel"><div class="panel-head"><div><div class="micro-label">' + T('WHO GETS HIT · OIL CHANNEL × ENERGY-IMPORT DEPENDENCE + WAR CHANNEL × REGION × TRADE OPENNESS', 'ΠΟΙΟΣ ΠΛΗΤΤΕΤΑΙ · ΚΑΝΑΛΙ ΠΕΤΡΕΛΑΙΟΥ × ΕΝΕΡΓΕΙΑΚΗ ΕΞΑΡΤΗΣΗ + ΚΑΝΑΛΙ ΠΟΛΕΜΟΥ × ΠΕΡΙΟΧΗ × ΑΝΟΙΓΜΑ') + '</div><h2 class="lab-title">' + T('Country impact map', 'Χάρτης επιπτώσεων ανά χώρα') + '</h2></div></div>' +
      '<div class="lab-two"><div id="lab-map" class="rd-world" style="height:420px"></div><div class="rd-table-wrap" style="max-height:420px"><table class="rd-table"><thead><tr><th>' + T('ECONOMY', 'ΧΩΡΑ') + '</th><th>ΔGDP</th><th>' + T('OIL', 'ΠΕΤΡ.') + '</th><th>' + T('WAR', 'ΠΟΛ.') + '</th><th>' + T('SIGNAL', 'ΣΗΜΑ') + '</th></tr></thead><tbody>' +
      s.rows.slice(0, 40).map(r => '<tr class="' + (r.iso3 === 'GRC' ? 'hl' : '') + '"><td class="cname"><b>' + esc(r.name) + '</b><small>' + esc(r.iso3) + (r.eImp != null ? ' · ' + T('energy imports ', 'ενεργ. εισαγωγές ') + num(r.eImp, 0) + '%' : '') + '</small></td><td class="mono ' + (r.dG <= -2 ? 'c-red' : r.dG <= -0.5 ? 'c-amber' : 'c-green') + '">' + sgn(r.dG, 1) + 'pp</td><td class="mono">' + sgn(r.dOil, 1) + '</td><td class="mono">' + sgn(r.dWar, 1) + '</td><td class="mono">' + (r.scoreNow == null ? '<span class="c-mute">—</span>' : num(r.scoreNow, 0) + ' → <span class="c-' + r.level + '">' + num(r.scoreNew, 0) + '</span>') + '</td></tr>').join('') +
      '</tbody></table></div></div><p class="fineprint">' + T('ΔGDP_c = −0.039·ΔBrent·(1 + 1.2·energy-imports_c/100) + war·m_region,c·(0.7 + exports_c/GDP). Net energy exporters (negative imports) gain from oil. Country multipliers for Taiwan scenarios follow Bloomberg Economics’ country/world ratios; others are declared assumptions. Recession signal′ = signal + 10·max(0, −ΔGDP).', 'ΔΑΕΠ_c = −0.039·ΔBrent·(1 + 1.2·ενεργ. εισαγωγές_c/100) + πόλεμος·m_περιοχής,c·(0.7 + εξαγωγές_c/ΑΕΠ). Οι καθαροί εξαγωγείς ενέργειας κερδίζουν από το πετρέλαιο. Οι πολλαπλασιαστές για τα σενάρια Ταϊβάν ακολουθούν τους λόγους χώρα/κόσμος του Bloomberg Economics· οι υπόλοιποι είναι δηλωμένες υποθέσεις. Σήμα ύφεσης′ = σήμα + 10·max(0, −ΔΑΕΠ).') + '</p></section>' +
      compareMatrix(d) + methodology();
    drawMc(hist, mc); drawMap(s);
  }
  function compareMatrix(d) {
    const rows = PRESETS.map(p => { const s = scenario(d, p); const mc = monteCarlo(d, p, 1500); return { p, s, mc }; });
    const reg = c => ({ EXPANSION: 'green', LOCAL: 'green', LATE_CYCLE: 'amber', GLOBAL_SLOWDOWN: 'amber', SYSTEMIC_WATCH: 'amber', GLOBAL_RECESSION: 'red', SYSTEMIC: 'red' }[c] || 'mute');
    return '<section class="panel"><div class="panel-head"><div><div class="micro-label">' + T('ALL SCENARIOS SIDE BY SIDE', 'ΟΛΑ ΤΑ ΣΕΝΑΡΙΑ ΔΙΠΛΑ-ΔΙΠΛΑ') + '</div><h2 class="lab-title">' + T('Scenario matrix', 'Πίνακας σεναρίων') + '</h2></div></div><div class="rd-table-wrap"><table class="rd-table"><thead><tr><th>' + T('SCENARIO', 'ΣΕΝΑΡΙΟ') + '</th><th>BRENT</th><th>' + T('WORLD GDP', 'ΠΑΓΚ. ΑΕΠ') + '</th><th>P(g&lt;2%)</th><th>P(g&lt;1%)</th><th>' + T('US P(12m)', 'ΗΠΑ P(12μ)') + '</th><th>' + T('STRESS', 'ΠΙΕΣΗ') + '</th><th>G20 CLI</th><th>' + T('REGIME', 'ΚΑΘΕΣΤΩΣ') + '</th><th>' + T('BASIS', 'ΒΑΣΗ') + '</th></tr></thead><tbody>' +
      rows.map(({ p, s, mc }) => '<tr><td class="cname"><b>' + p.icon + ' ' + esc(el() ? p.name[1] : p.name[0]) + '</b></td><td class="mono">$' + num(s.brent, 0) + '</td><td class="mono ' + (s.g < 1 ? 'c-red' : s.g < 2 ? 'c-amber' : 'c-green') + '">' + num(s.g, 1) + '%</td><td class="mono">' + num(mc.p2, 0) + '%</td><td class="mono">' + num(mc.p1, 0) + '%</td><td class="mono">' + num(s.P1, 0) + '%</td><td class="mono">' + num(s.S, 0) + '%</td><td class="mono">' + num(s.g20, 1) + '</td><td class="mono c-' + reg(s.verdict && s.verdict.code) + '">' + esc(s.verdict ? s.verdict.code.replace('_', ' ') : '—') + '</td><td><em class="tag-' + p.tag.toLowerCase() + '">' + p.tag + '</em></td></tr>').join('') +
      '</tbody></table></div></section>';
  }
  function methodology() {
    return '<section class="panel"><div class="micro-label">' + T('WHAT THE LAB CAN AND CANNOT CLAIM', 'ΤΙ ΜΠΟΡΕΙ ΚΑΙ ΤΙ ΔΕΝ ΜΠΟΡΕΙ ΝΑ ΙΣΧΥΡΙΣΤΕΙ ΤΟ LAB') + '</div><h2 class="lab-title">' + T('Method, sources, limits', 'Μέθοδος, πηγές, όρια') + '</h2><div class="rd-model-grid">' +
      '<div><h4>' + T('CALIBRATION', 'ΒΑΘΜΟΝΟΜΗΣΗ') + '</h4><div class="rd-kv"><span>' + T('Base world growth / oil', 'Βάση ανάπτυξης / πετρέλαιο') + '</span><b>3.4% · $87.4</b></div><div class="rd-kv"><span>' + T('Oil slope (IMF Apr 2026 scenarios)', 'Κλίση πετρελαίου (σενάρια ΔΝΤ Απρ. 2026)') + '</span><b>−0.039 pp/$</b></div><div class="rd-kv"><span>' + T('CLI per pp of growth (2009, 2020)', 'CLI ανά μ.β. ανάπτυξης (2009, 2020)') + '</span><b>1.4</b></div><div class="rd-kv"><span>' + T('Taiwan blockade / war (Bloomberg Econ.)', 'Ταϊβάν αποκλεισμός / πόλεμος (Bloomberg)') + '</span><b>−5 / −10.2%</b></div><div class="rd-kv"><span>' + T('Hormuz closure, net / gross (IMF Oct 2026)', 'Κλείσιμο Ορμούζ, καθαρό / μικτό (ΔΝΤ Οκτ. 2026)') + '</span><b>−0.3 / −0.9pp</b></div></div>' +
      '<div><h4>' + T('WHY SCENARIOS, NOT FORECASTS', 'ΓΙΑΤΙ ΣΕΝΑΡΙΑ ΚΑΙ ΟΧΙ ΠΡΟΒΛΕΨΕΙΣ') + '</h4><p class="fineprint" style="margin:0">' + T('Wars, blockades and world wars are too rare to estimate their probability or their transmission from data — the same lesson as the evidence ledger (few independent episodes, arriving in waves). The Lab therefore conditions on a shock you choose and propagates it through the radar’s fitted and rule-based layers with every coefficient on screen.', 'Πόλεμοι, αποκλεισμοί και παγκόσμιοι πόλεμοι είναι πολύ σπάνιοι για να εκτιμηθεί η πιθανότητα ή η μετάδοσή τους από δεδομένα — το ίδιο δίδαγμα με το evidence ledger (λίγα ανεξάρτητα επεισόδια, σε κύματα). Γι’ αυτό το Lab υποθέτει ένα σοκ που διαλέγεις και το περνά από τα εκτιμημένα και κανονιστικά επίπεδα του ραντάρ, με κάθε συντελεστή στην οθόνη.') + '</p></div>' +
      '<div><h4>' + T('KNOWN LIMITS', 'ΓΝΩΣΤΑ ΟΡΙΑ') + '</h4><p class="fineprint" style="margin:0">' + T('Linear oil rule (non-linear above ~$150 is likely worse); no second-round inflation loop beyond the rate slider; war hits treated as first-year growth losses; country channels ignore supply-chain links (e.g. Taiwan semiconductors) except through region multipliers; nuclear use is not modelled.', 'Γραμμικός κανόνας πετρελαίου (πάνω από ~$150 μάλλον χειρότερα)· χωρίς βρόχο πληθωρισμού δεύτερου γύρου πέρα από το επιτόκιο· τα σοκ πολέμου ως απώλεια ανάπτυξης πρώτου έτους· οι χώρες αγνοούν αλυσίδες εφοδιασμού (π.χ. ημιαγωγοί Ταϊβάν) πέρα από τους πολλαπλασιαστές· η χρήση πυρηνικών δεν μοντελοποιείται.') + '</p></div></div></section>';
  }
  function drawMc(hist, mc) {
    const c = chart('lab-mc'); if (!c) return;
    c.setOption({ backgroundColor: 'transparent', grid: { left: 40, right: 12, top: 12, bottom: 30 }, tooltip: Object.assign({ trigger: 'axis' }, TT),
      xAxis: { type: 'category', data: hist.map(h => h[0].toFixed(1)), axisLabel: { color: '#8b93b8', fontSize: 9 }, axisLine: { lineStyle: { color: '#252b45' } } },
      yAxis: { type: 'value', axisLabel: { show: false }, splitLine: { show: false } },
      series: [{ type: 'bar', data: hist.map(h => ({ value: h[1], itemStyle: { color: h[0] < 0 ? '#f43f5e' : h[0] < 1 ? '#fb923c' : h[0] < 2 ? '#f5c869' : '#34d399' } })), barCategoryGap: '8%',
        markLine: { silent: true, symbol: 'none', label: { fontSize: 9, color: '#f5c869' }, lineStyle: { color: '#f5c869', type: 'dashed' }, data: [2, 1, 0].map(th => { let k = 0, best = 1e9; hist.forEach((h, i) => { const dd = Math.abs(h[0] - th); if (dd < best) { best = dd; k = i; } }); return { xAxis: k, label: { formatter: th + '%' } }; }) } }] });
  }
  async function drawMap(s) {
    const box = $('lab-map'); if (!box || typeof echarts === 'undefined') return;
    try {
      if (!L.geoJson) { const r = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'); L.geoJson = await r.json(); echarts.registerMap('wf-lab', L.geoJson); }
      const by = Object.fromEntries(s.rows.map(r => [r.iso3, r]));
      const data = L.geoJson.features.map(f => { const r = by[f.id]; return { name: f.properties.name, value: r ? Math.round(r.dG * 10) / 10 : null, r }; });
      const c = chart('lab-map');
      c.setOption({ backgroundColor: 'transparent', tooltip: Object.assign({ trigger: 'item', formatter: p => { const r = p.data && p.data.r; return r ? '<b>' + esc(r.name) + '</b><br/>ΔGDP ' + sgn(r.dG, 1) + 'pp (oil ' + sgn(r.dOil, 1) + ', war ' + sgn(r.dWar, 1) + ')' : esc(p.name) + '<br/>no data'; } }, TT),
        visualMap: { min: -8, max: 1, calculable: false, orient: 'horizontal', left: 10, bottom: 6, itemHeight: 120, itemWidth: 10, inRange: { color: ['#9f1239', '#f43f5e', '#fb923c', '#fbbf24', '#34d399'] }, text: ['+1pp', '−8pp'], textStyle: { color: '#8b93b8', fontSize: 10 } },
        series: [{ type: 'map', map: 'wf-lab', roam: true, zoom: 1.15, data, itemStyle: { areaColor: '#161b30', borderColor: '#070912', borderWidth: 0.5 }, emphasis: { label: { show: false }, itemStyle: { areaColor: '#f5c869' } }, select: { disabled: true } }] });
    } catch (e) { box.innerHTML = '<div class="chart-no-data">Map unavailable: ' + esc(e.message) + '</div>'; }
  }
  window.addEventListener('resize', () => Object.values(L.chart).forEach(c => c && c.resize()));
  window.addEventListener('wf:locale', () => { const root = $('lab-root'); if (root && root.dataset.ready && window.FaultlineRadar && window.FaultlineRadar.data) { renderGeo(); renderLab(window.FaultlineRadar.data); } });
  window.FaultlineLab = { show, PRESETS, CAL };
})();
