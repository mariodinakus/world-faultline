/* WORLD FAULTLINE · Recession & Crisis Radar — front end (v1.0) */
(function () {
  'use strict';
  const API = '/api/radar';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d = 1) => (v == null || !Number.isFinite(Number(v)) ? '—' : Number(v).toFixed(d));
  const sgn = (v, d = 1) => (v == null ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(d));
  const S = { data: null, loading: false, error: null, charts: {}, region: 'all', loadedAt: null };

  /* ---------------- i18n ---------------- */
  const T = {
    en: {
      regimes: { EXPANSION: 'Expansion', LOCAL: 'Local / regional recessions', LATE_CYCLE: 'Late cycle — watch', GLOBAL_SLOWDOWN: 'Global slowdown', SYSTEMIC_WATCH: 'Financial stress building', GLOBAL_RECESSION: 'Global recession signal', SYSTEMIC: 'Systemic crisis (2008-type)' },
      regimeText: {
        EXPANSION: 'Leading indicators, financial conditions and the fitted US model are all consistent with continued growth.',
        LOCAL: 'The global cycle is holding, but individual economies are flashing recession signals — a local, not global, problem so far.',
        LATE_CYCLE: 'Growth continues but momentum is fading: leading indicators are rolling over or recession odds are rising. Not a recession call.',
        GLOBAL_SLOWDOWN: 'Leading indicators point to below-trend global growth. Historically most slowdowns of this kind (1998, 2012, 2016, 2019) did not become global recessions.',
        SYSTEMIC_WATCH: 'Financial stress has risen to at least a third of its 2008 peak. Watch credit spreads, bank funding and volatility.',
        GLOBAL_RECESSION: 'Leading indicators for most of world GDP are contracting together — the pattern seen before 1975, 1982, 1991, 2009 and 2020.',
        SYSTEMIC: 'Financial stress is near GFC levels while the real economy is contracting — the combination that defined 2008.'
      },
      q: { global: 'GLOBAL RECESSION?', systemic: 'A 2008-TYPE CRISIS?', us: 'US RECESSION, NEXT 12M', local: 'LOCAL RECESSIONS' },
      lvl: { low: 'LOW', moderate: 'MODERATE', elevated: 'ELEVATED', high: 'HIGH', 'n/a': 'N/A' },
      updated: 'Computed', asof: 'Latest data', loading: 'Pulling live data from FRED, OECD, ECB and Eurostat…', retry: 'RETRY',
      map: 'Crisis map: recession odds × financial stress', analogs: 'Closest historical analogs', usHist: 'US recession probability (12-month horizon)',
      stressHist: 'Financial stress as % of the 2008 peak', cycle: 'Global cycle: G20 leading indicator & downturn diffusion', signals: 'Early-warning signal board',
      countries: 'Country radar — where are recessions forming?', model: 'Model card & backtest', all: 'ALL'
    },
    el: {
      regimes: { EXPANSION: 'Επέκταση', LOCAL: 'Τοπικές / περιφερειακές υφέσεις', LATE_CYCLE: 'Ώριμη φάση κύκλου — επιτήρηση', GLOBAL_SLOWDOWN: 'Παγκόσμια επιβράδυνση', SYSTEMIC_WATCH: 'Συσσώρευση χρηματοπιστωτικής πίεσης', GLOBAL_RECESSION: 'Σήμα παγκόσμιας ύφεσης', SYSTEMIC: 'Συστημική κρίση (τύπου 2008)' },
      regimeText: {
        EXPANSION: 'Οι πρόδρομοι δείκτες, οι χρηματοπιστωτικές συνθήκες και το εκτιμημένο μοντέλο των ΗΠΑ συνάδουν με συνέχιση της ανάπτυξης.',
        LOCAL: 'Ο παγκόσμιος κύκλος αντέχει, αλλά μεμονωμένες οικονομίες δίνουν σήμα ύφεσης — μέχρι στιγμής τοπικό, όχι παγκόσμιο πρόβλημα.',
        LATE_CYCLE: 'Η ανάπτυξη συνεχίζεται αλλά η δυναμική εξασθενεί: οι πρόδρομοι δείκτες γυρίζουν ή αυξάνεται η πιθανότητα ύφεσης. Δεν είναι πρόβλεψη ύφεσης.',
        GLOBAL_SLOWDOWN: 'Οι πρόδρομοι δείκτες δείχνουν παγκόσμια ανάπτυξη κάτω από την τάση. Ιστορικά οι περισσότερες τέτοιες επιβραδύνσεις (1998, 2012, 2016, 2019) δεν έγιναν παγκόσμια ύφεση.',
        SYSTEMIC_WATCH: 'Η χρηματοπιστωτική πίεση έφτασε τουλάχιστον στο 1/3 της κορύφωσης του 2008. Προσοχή σε spreads, χρηματοδότηση τραπεζών, μεταβλητότητα.',
        GLOBAL_RECESSION: 'Οι πρόδρομοι δείκτες για το μεγαλύτερο μέρος του παγκόσμιου ΑΕΠ συρρικνώνονται ταυτόχρονα — το μοτίβο πριν από το 1975, 1982, 1991, 2009 και 2020.',
        SYSTEMIC: 'Η χρηματοπιστωτική πίεση πλησιάζει τα επίπεδα του 2008 ενώ η πραγματική οικονομία συρρικνώνεται — ο συνδυασμός που όρισε το 2008.'
      },
      q: { global: 'ΠΑΓΚΟΣΜΙΑ ΥΦΕΣΗ;', systemic: 'ΚΡΙΣΗ ΤΥΠΟΥ 2008;', us: 'ΥΦΕΣΗ ΗΠΑ, ΕΠΟΜΕΝΟΙ 12 ΜΗΝΕΣ', local: 'ΤΟΠΙΚΕΣ ΥΦΕΣΕΙΣ' },
      lvl: { low: 'ΧΑΜΗΛΟΣ', moderate: 'ΜΕΤΡΙΟΣ', elevated: 'ΑΥΞΗΜΕΝΟΣ', high: 'ΥΨΗΛΟΣ', 'n/a': 'Μ/Δ' },
      updated: 'Υπολογίστηκε', asof: 'Τελευταία δεδομένα', loading: 'Λήψη ζωντανών δεδομένων από FRED, OECD, ΕΚΤ και Eurostat…', retry: 'ΞΑΝΑ',
      map: 'Χάρτης κρίσεων: πιθανότητα ύφεσης × χρηματοπιστωτική πίεση', analogs: 'Πλησιέστερα ιστορικά ανάλογα', usHist: 'Πιθανότητα ύφεσης ΗΠΑ (ορίζοντας 12 μηνών)',
      stressHist: 'Χρηματοπιστωτική πίεση ως % της κορύφωσης του 2008', cycle: 'Παγκόσμιος κύκλος: πρόδρομος δείκτης G20 & διάχυση συρρίκνωσης', signals: 'Πίνακας σημάτων έγκαιρης προειδοποίησης',
      countries: 'Ραντάρ χωρών — πού σχηματίζονται υφέσεις;', model: 'Κάρτα μοντέλου & backtest', all: 'ΟΛΕΣ'
    }
  };
  const loc = () => (window.WF_LOCALE === 'el' ? 'el' : 'en');
  const t = () => T[loc()];
  const ORDER = ['EXPANSION', 'LOCAL', 'LATE_CYCLE', 'GLOBAL_SLOWDOWN', 'SYSTEMIC_WATCH', 'GLOBAL_RECESSION', 'SYSTEMIC'];
  const TONE = { EXPANSION: 'green', LOCAL: 'green', LATE_CYCLE: 'amber', GLOBAL_SLOWDOWN: 'amber', SYSTEMIC_WATCH: 'amber', GLOBAL_RECESSION: 'red', SYSTEMIC: 'red' };
  const lvlClass = l => 'lv-' + (l === 'n/a' ? 'na' : l);

  /* ---------------- data ---------------- */
  async function load(force) {
    if (S.loading) return;
    S.loading = true; S.error = null;
    if (!S.data) $('radar-root').innerHTML = '<div class="rd-loading"><div class="orbit"></div>' + esc(t().loading) + '</div>';
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 90000);
      const r = await fetch(API + (force ? '?t=' + Date.now() : ''), { signal: ctrl.signal });
      clearTimeout(timer);
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.message || ('HTTP ' + r.status));
      if (S.data && S.data.generatedAt !== j.generatedAt) S.prevSnap = snapshot(S.data);
      S.data = j; S.loadedAt = new Date();
      render(); stamp();
      if (j.sources && j.sources.oecd && !j.sources.oecd.ok) relayOecd();
    } catch (e) {
      S.error = e.name === 'AbortError' ? 'Timed out' : e.message;
      if (!S.data) $('radar-root').innerHTML = '<div class="rd-error">Radar data unavailable: ' + esc(S.error) + '. No substitute values are shown.<br/><br/><button class="small-btn" id="rd-retry">↻ ' + esc(t().retry) + '</button></div>';
      const b = $('rd-retry'); if (b) b.onclick = () => load(true);
    } finally { S.loading = false; }
  }

  // OECD sometimes refuses cloud servers; browsers are allowed (CORS). Fetch here, recompute server-side.
  async function relayOecd() {
    try {
      const url = 'https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,/USA+CHN+DEU+JPN+IND+GBR+FRA+ITA+BRA+CAN+MEX+KOR+ESP+AUS+IDN+TUR+ZAF+G20.M.LI...AA...H?startPeriod=1970-01&format=csvfile';
      const r = await fetch(url); if (!r.ok) return; const csv = await r.text();
      const p = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oecd: csv }) });
      const j = await p.json(); if (p.ok && !j.error && j.sources.oecd.ok) { S.data = j; render(); window.dispatchEvent(new Event('wf:radar')); }
    } catch (e) { /* keep server result; OECD gap stays disclosed */ }
  }

  /* ---------------- what changed ---------------- */
  const SNAP_KEY = 'wf-radar-snapshot-v1';
  function snapshot(d) {
    return { t: d.generatedAt, code: d.verdict.code, P: d.current.p, S: d.current.stress, g20: d.current.g20, diff: d.current.diff,
      sig: Object.fromEntries(d.signals.map(s => [s.id, [s.value, s.status, s.label]])),
      cty: Object.fromEntries(d.countries.filter(c => c.score != null).map(c => [c.iso3, [c.score, c.level, c.name]])) };
  }
  function readSnap() { try { return JSON.parse(localStorage.getItem(SNAP_KEY) || 'null'); } catch (e) { return null; } }
  function writeSnap(x) { try { localStorage.setItem(SNAP_KEY, JSON.stringify(x)); } catch (e) {} }
  function renderChanges() {
    const box = $('rd-changes'); if (!box || !S.data) return;
    const el = loc() === 'el'; const cur = snapshot(S.data);
    // baseline: previous refresh in this session, else the snapshot saved on the last visit
    if (!S.baseline) { const stored = readSnap(); S.baseline = stored && stored.t !== cur.t ? stored : (stored && stored.base ? stored.base : null); }
    if (S.prevSnap) S.baseline = S.prevSnap;
    const b = S.baseline;
    const stored = readSnap(); if (!stored || stored.t !== cur.t) writeSnap(Object.assign({}, cur, { base: b || null }));
    if (!b) { box.innerHTML = '<div class="rd-changes"><span class="rd-ch-head">' + (el ? 'ΤΙ ΑΛΛΑΞΕ' : 'WHAT CHANGED') + '</span><span class="rd-ch-empty">' + (el ? 'Πρώτη καταγραφή σε αυτόν τον browser — από την επόμενη ενημέρωση θα βλέπεις εδώ τι άλλαξε.' : 'First snapshot in this browser — from the next update you will see what changed here.') + '</span></div>'; return; }
    const items = [];
    const ago = (() => { const m = Math.round((new Date(cur.t) - new Date(b.t)) / 60e3); return m < 60 ? m + '′' : m < 2880 ? Math.round(m / 60) + (el ? ' ώρες' : 'h') : Math.round(m / 1440) + (el ? ' ημέρες' : 'd'); })();
    const num_ = (k, label, unit, dec, worseUp, thr) => { const a = b[k], c = cur[k]; if (a == null || c == null) return; const dlt = c - a; if (Math.abs(dlt) < thr) return; const bad = worseUp ? dlt > 0 : dlt < 0; items.push({ w: Math.abs(dlt) / thr, h: '<span class="rd-ch ' + (bad ? 'bad' : 'good') + '">' + (dlt > 0 ? '▲' : '▼') + ' ' + label + ' <b>' + a.toFixed(dec) + unit + ' → ' + c.toFixed(dec) + unit + '</b></span>' }); };
    if (b.code !== cur.code) { const ord = ['EXPANSION', 'LOCAL', 'LATE_CYCLE', 'GLOBAL_SLOWDOWN', 'SYSTEMIC_WATCH', 'GLOBAL_RECESSION', 'SYSTEMIC']; const bad = ord.indexOf(cur.code) > ord.indexOf(b.code); items.push({ w: 99, h: '<span class="rd-ch ' + (bad ? 'bad' : 'good') + ' big">' + (bad ? '▲' : '▼') + ' ' + (el ? 'Καθεστώς: ' : 'Regime: ') + '<b>' + esc(t().regimes[b.code]) + ' → ' + esc(t().regimes[cur.code]) + '</b></span>' }); }
    num_('P', el ? 'Πιθ. ύφεσης ΗΠΑ' : 'US recession prob.', '%', 1, true, 0.3);
    num_('S', el ? 'Πίεση (% 2008)' : 'Stress (% of 2008)', '%', 0, true, 1);
    num_('g20', 'G20 CLI', '', 2, false, 0.02);
    num_('diff', el ? 'Διάχυση συρρίκνωσης' : 'Downturn diffusion', '%', 0, true, 2);
    const rank = { ok: 0, watch: 1, alert: 2, na: -1 };
    Object.entries(cur.sig).forEach(([id, [v, st, lab]]) => { const p = b.sig && b.sig[id]; if (!p) return; if (p[1] !== st && rank[st] >= 0 && rank[p[1]] >= 0) { const bad = rank[st] > rank[p[1]]; items.push({ w: 20, h: '<span class="rd-ch ' + (bad ? 'bad' : 'good') + '">' + (bad ? '⚠' : '✓') + ' ' + esc(lab) + ' <b>' + p[1].toUpperCase() + ' → ' + st.toUpperCase() + '</b></span>' }); } else if (v != null && p[0] != null && p[0] !== v) { const rel = Math.abs(v - p[0]) / (Math.abs(p[0]) || 1); if (rel >= 0.05) items.push({ w: rel * 10, h: '<span class="rd-ch neutral">' + (v > p[0] ? '▲' : '▼') + ' ' + esc(lab) + ' <b>' + p[0] + ' → ' + v + '</b></span>' }); } });
    Object.entries(cur.cty).forEach(([iso, [sc, lv, name]]) => { const p = b.cty && b.cty[iso]; if (!p) return; if (p[1] !== lv) { const r = { green: 0, amber: 1, red: 2 }; const bad = r[lv] > r[p[1]]; items.push({ w: 15, h: '<span class="rd-ch ' + (bad ? 'bad' : 'good') + '">' + esc(name) + ' <b>' + p[1] + ' → ' + lv + '</b> (' + p[0] + '→' + sc + ')</span>' }); } });
    items.sort((x, y) => y.w - x.w);
    box.innerHTML = '<div class="rd-changes"><span class="rd-ch-head">' + (el ? 'ΤΙ ΑΛΛΑΞΕ · ΤΑ ΤΕΛΕΥΤΑΙΑ ' : 'WHAT CHANGED · LAST ') + ago + '</span>' + (items.length ? items.slice(0, 14).map(i => i.h).join('') + (items.length > 14 ? '<span class="rd-ch neutral">+' + (items.length - 14) + '</span>' : '') : '<span class="rd-ch-empty">' + (el ? 'Καμία ουσιαστική αλλαγή — οι πηγές δεν έχουν δημοσιεύσει νέα στοιχεία που μετακινούν τους δείκτες.' : 'No material change — sources have not published anything that moves the indicators.') + '</span>') + '</div>';
  }

  /* ---------------- render ---------------- */
  function render() {
    const d = S.data; if (!d) return;
    const L = t(), v = d.verdict, A = v.answers;
    const tone = TONE[v.code] || 'amber';
    const fmtDate = s => s ? new Date(s).toLocaleString(loc() === 'el' ? 'el-GR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
    const srcBadge = (k, s) => '<span class="' + (s && s.ok && !(s.errors || []).length ? 'ok' : s && s.ok ? 'ok' : 'bad') + '" title="' + esc((s && s.errors || []).join(' | ')) + '">' + k.toUpperCase() + ((s && s.errors && s.errors.length) ? ' · ' + s.errors.length + ' gap' + (s.errors.length > 1 ? 's' : '') : '') + '</span>';
    const red = A.local.red.map(iso => d.countries.find(c => c.iso3 === iso)).filter(Boolean);
    const amber = A.local.amber.map(iso => d.countries.find(c => c.iso3 === iso)).filter(Boolean);
    const P = A.us.p, SP = A.systemic.pctOf2008;
    const html = [];
    html.push('<section class="rd-verdict" data-tone="' + tone + '" style="--rd-tone:var(--' + (tone === 'green' ? 'teal' : tone) + ')"><div class="rd-verdict-top"><div><div class="micro-label">LIVE VERDICT · RULE-BASED SYNTHESIS OF THE SIGNALS BELOW</div><h2>' + esc(L.regimes[v.code]) + '</h2><p>' + esc(L.regimeText[v.code]) + '</p></div>' +
      '<div class="rd-meta">' + esc(L.updated) + ' <b>' + esc(fmtDate(d.generatedAt)) + '</b><br/>US model month <b>' + esc(d.us.latest ? d.us.latest.month + (d.us.latest.partial ? ' (MTD)' : '') : '—') + '</b><br/>G20 CLI <b>' + esc(d.global.g20.month || '—') + '</b> · EA CISS <b>' + esc(d.stress.ea.latestDaily ? d.stress.ea.latestDaily.date : '—') + '</b><div class="rd-src">' + ['fred', 'oecd', 'ecb', 'eurostat'].map(k => srcBadge(k, d.sources[k])).join('') + '</div></div></div>' +
      '<div class="rd-ladder">' + ORDER.map(c => { const on = ORDER.indexOf(c) <= ORDER.indexOf(v.code); return '<div class="rd-step' + (on ? ' on' : '') + (c === v.code ? ' current' : '') + '" data-tone="' + TONE[c] + '">' + esc(L.regimes[c]) + '</div>'; }).join('') + '</div></section>');

    html.push('<div id="rd-changes"></div>');
    // Four answers
    const g = A.global;
    html.push('<div class="rd-answers">' +
      card(L.q.global, num(g.g20, 2), 'G20 CLI', g.level, (loc() === 'el' ? 'Πρόδρομος δείκτης G20 (100 = τάση). ' : 'G20 leading indicator (100 = trend). ') + '6m: ' + sgn(g.g20ch6, 2) + ' · ' + (loc() === 'el' ? 'διάχυση συρρίκνωσης ' : 'downturn diffusion ') + num(g.diff, 0) + '% ' + (loc() === 'el' ? 'του ΑΕΠ. Παγκόσμιες υφέσεις: CLI < 98.8 (1991 98.8 · 2009 95.4 · 2020 89.4).' : 'of GDP. Global recessions: CLI < 98.8 (1991 98.8 · 2009 95.4 · 2020 89.4).'), gauge(g.g20 == null ? null : (101 - g.g20) / 6 * 100, (101 - 98.8) / 6 * 100)) +
      card(L.q.systemic, SP == null ? '—' : num(SP, 0) + '<small>% of 2008</small>', '', A.systemic.level, 'US ' + num(A.systemic.us, 0) + '% · Euro area ' + num(A.systemic.ea, 0) + '%. ' + (loc() === 'el' ? 'Συσσώρευση πιστωτικής φούσκας (BIS): ' : 'Credit-boom build-up (BIS): ') + ((A.systemic.boomRed || []).length ? '<b class=\'c-red\'>' + A.systemic.boomRed.join(', ') + '</b>' : (loc() === 'el' ? 'καμία χώρα στο κόκκινο' : 'no economy red')) + ((A.systemic.boomAmber || []).length ? ' · amber ' + A.systemic.boomAmber.join(', ') : '') + ' · ' + (loc() === 'el' ? 'παγκόσμια Δ2ετ πίστωσης/ΑΕΠ ' : 'global 2y Δcredit/GDP ') + sgn(A.systemic.globalCreditD8, 1) + 'pp. ' + (loc() === 'el' ? '0% = μακροχρόνιος διάμεσος, 100% = κορύφωση 2008 (NFCI, Baa spread, VIX, STLFSI · CISS ΕΚΤ).' : '0% = long-run median, 100% = 2008 peak (NFCI, Baa spread, VIX, STLFSI · ECB CISS).'), gauge(SP, 60)) +
      card(L.q.us, P == null ? '—' : num(P, 0) + '<small>%</small>', '', A.us.level, (loc() === 'el' ? 'Εκτιμημένο logit σε ημερομηνίες NBER, out-of-sample AUC ' : 'Fitted logit on NBER dates, out-of-sample AUC ') + num(d.us.model.backtest.oosAuc, 2) + '. 3m: ' + sgn(d.us.change3m, 1) + 'pp' + (d.us.latest && d.us.latest.partial ? ' · MTD' : '') + (A.us.alarmThreshold != null ? ' · ' + (loc() === 'el' ? 'όριο συναγερμού (Sarlin, μ=' + A.us.alarmMu + '): ' : 'alarm threshold (Sarlin, μ=' + A.us.alarmMu + '): ') + A.us.alarmThreshold + '%' : ''), gauge(P, A.us.alarmThreshold ?? 50)) +
      card(L.q.local, String(red.length) + '<small>/ ' + d.countries.length + '</small>', '', A.local.level, red.length ? (loc() === 'el' ? 'Κόκκινο: ' : 'Red: ') + red.map(c => esc(c.name)).join(', ') + (amber.length ? ' · ' + (loc() === 'el' ? 'πορτοκαλί: ' : 'amber: ') + amber.slice(0, 6).map(c => esc(c.name)).join(', ') + (amber.length > 6 ? '…' : '') : '') : (loc() === 'el' ? 'Καμία οικονομία στο κόκκινο. ' : 'No economy in the red. ') + (amber.length ? (loc() === 'el' ? 'Πορτοκαλί: ' : 'Amber: ') + amber.slice(0, 8).map(c => esc(c.name)).join(', ') : ''), gauge(d.countries.length ? 100 * red.length / d.countries.length : null, 25)) +
      '</div>');

    // How close are we + world map
    html.push(proximityHtml(d));
    html.push(worldMapHtml(d));
    html.push('<section class="panel" id="rd-dossier-panel"></section>');

    // Map + analogs
    html.push('<div class="rd-row"><section class="panel"><div class="panel-head"><div><div class="micro-label">REGIME SPACE · LAST 24 MONTHS VS. PAST CRISES</div><h2>' + esc(L.map) + '</h2></div></div><div id="rd-map" class="rd-chart tall"></div><div class="rd-legend"><span><i style="background:#e8f0f3"></i>NOW + 24M TRAIL</span><span><i style="background:#f43f5e"></i>SYSTEMIC EPISODE</span><span><i style="background:#fbbf24"></i>GLOBAL RECESSION</span><span><i style="background:#38bdf8"></i>OTHER EPISODE</span></div></section>' +
      '<section class="panel"><div class="panel-head"><div><div class="micro-label">NEAREST NEIGHBOUR · P, STRESS, G20 CLI, DIFFUSION</div><h2>' + esc(L.analogs) + '</h2></div></div><div class="rd-analogs">' +
      d.analogs.map((a, i) => '<div class="rd-analog"><span class="n">0' + (i + 1) + '</span><div><b>' + esc(a.name) + (a.systemic ? '<span class="rd-tag red">SYSTEMIC</span>' : '') + (a.global ? '<span class="rd-tag amber">GLOBAL</span>' : '') + '</b><small>' + esc(a.type) + '</small><small>P ' + num(a.vec.p, 0) + '% · stress ' + num(a.vec.stress, 0) + '% · G20 ' + num(a.vec.g20, 1) + ' · diff ' + num(a.vec.diff, 0) + '%</small></div><div class="d">' + num(a.distance, 2) + '<small><br/>σ-dist</small></div></div>').join('') +
      '</div><p class="fineprint">Now: P ' + num(d.current.p, 0) + '% · stress ' + num(d.current.stress, 0) + '% · G20 ' + num(d.current.g20, 2) + ' · diffusion ' + num(d.current.diff, 0) + '%. Distance is the RMS of standardized gaps (σ of 1985–today). An analog describes resemblance, not destiny.</p></section></div>');

    // History charts
    html.push('<section class="panel"><div class="panel-head"><div><div class="micro-label">MODEL ' + esc(d.us.model.id) + ' · NBER RECESSIONS SHADED</div><h2>' + esc(L.usHist) + '</h2></div><span class="panel-hint">FITTED (IN-SAMPLE) VS. PSEUDO OUT-OF-SAMPLE</span></div><div id="rd-us" class="rd-chart"></div><div class="rd-callout">' + esc(d.us.model.backtest.note) + '</div></section>');
    html.push('<div class="rd-row"><section class="panel"><div class="panel-head"><div><div class="micro-label">GFC-EQUIVALENCE · 100 = 2008 PEAK</div><h2>' + esc(L.stressHist) + '</h2></div></div><div id="rd-stress" class="rd-chart"></div></section>' +
      '<section class="panel"><div class="panel-head"><div><div class="micro-label">OECD CLI · AMPLITUDE ADJUSTED</div><h2>' + esc(L.cycle) + '</h2></div></div><div id="rd-cycle" class="rd-chart"></div></section></div>');

    // Signals
    const groups = {}; d.signals.forEach(s => (groups[s.group] = groups[s.group] || []).push(s));
    const counts = { alert: 0, watch: 0, ok: 0 }; d.signals.forEach(s => { if (counts[s.status] != null) counts[s.status]++; });
    html.push('<section class="panel"><div class="panel-head"><div><div class="micro-label">US DAILY / WEEKLY / MONTHLY · FRED</div><h2>' + esc(L.signals) + '</h2></div><span class="panel-hint"><span class="c-red">● ' + counts.alert + ' ALERT</span> · <span class="c-amber">● ' + counts.watch + ' WATCH</span> · <span class="c-green">● ' + counts.ok + ' OK</span></span></div>' +
      Object.entries(groups).map(([gname, arr]) => '<div class="rd-group">' + esc(gname.toUpperCase()) + '</div><div class="rd-signals">' + arr.map(sigCard).join('') + '</div>').join('') + '</section>');

    // Countries
    const regions = ['all'].concat([...new Set(d.countries.map(c => c.region))]);
    html.push('<section class="panel"><div class="panel-head"><div><div class="micro-label">OECD CLI · EUROSTAT ESI & GDP · ECB CISS & BOND SPREADS</div><h2>' + esc(L.countries) + '</h2></div><div class="rd-tools" id="rd-regions">' + regions.map(r => '<button data-region="' + esc(r) + '" class="' + (S.region === r ? 'on' : '') + '">' + esc(r === 'all' ? L.all : r.toUpperCase()) + '</button>').join('') + '</div></div><div class="rd-table-wrap"><table class="rd-table"><thead><tr><th>ECONOMY</th><th>RECESSION SIGNAL</th><th>OECD CLI · 3M</th><th>PHASE</th><th>SENTIMENT (ESI)</th><th>GDP Q/Q · LAST 2</th><th>STRESS (CISS)</th><th>10Y vs BUND</th><th>CREDIT BOOM (BIS)</th></tr></thead><tbody id="rd-ctry"></tbody></table></div>' +
      '<p class="fineprint">Score 0–100 = weighted mean of available components (real activity ×2: CLI, ESI, GDP; financial ×1: CISS, sovereign spread). Red ≥60, amber ≥40. Thresholds are transparent rules, not fitted per country: CLI 101→0, 100→30, 99→55, 98→80, ≤97→100 (+15 if falling); ESI 105→0 … ≤85→100; two negative GDP quarters = 100; CISS 0.05→0 … 0.6→100; spread 1pp→0 … 6pp→100.</p></section>');

    // Live equations
    html.push(equationsHtml(d));
    // Evidence ledger (Dinakus 2026)
    html.push(evidenceHtml(d));

    // Model card
    const m = d.us.model, bt = m.backtest;
    html.push('<section class="panel"><div class="panel-head"><div><div class="micro-label">TRANSPARENCY · WHAT THE NUMBERS CAN AND CANNOT CLAIM</div><h2>' + esc(L.model) + '</h2></div></div><div class="rd-model-grid">' +
      '<div><h4>US 12M RECESSION MODEL</h4><div class="equation" style="font-size:12px;padding:12px;margin:0 0 10px">P = σ(' + m.beta[0].toFixed(2) + ' ' + m.vars.map((x, j) => (m.beta[j + 1] >= 0 ? '+ ' : '− ') + Math.abs(m.beta[j + 1]).toFixed(2) + '·z(' + x.id + ')').join(' ') + ')</div>' +
      m.vars.map(x => '<div class="rd-kv"><span>' + esc(x.label) + '</span><b>' + esc(x.id) + '</b></div>').join('') +
      '<div class="rd-kv"><span>Ridge penalty λ · sample</span><b>' + m.lambda + ' · ' + esc(m.sample.from) + '→' + esc(m.sample.to) + '</b></div><div class="rd-kv"><span>Recession onsets in sample</span><b>' + m.sample.onsets + '</b></div></div>' +
      '<div><h4>OUT-OF-SAMPLE BACKTEST</h4><div class="rd-kv"><span>AUC, expanding window 1985→</span><b>' + num(bt.oosAuc, 3) + '</b></div><div class="rd-kv"><span>Brier score (climatology)</span><b>' + num(bt.oosBrier, 3) + ' (' + num(bt.brierClimatology, 3) + ')</b></div><div class="rd-kv"><span>AUC, leave-one-cycle-out</span><b>' + num(bt.locoAuc, 3) + '</b></div>' +
      '<div class="rd-kv" style="border:0;margin-top:6px"><span>Calibration: predicted bin → realised</span><b></b></div>' + bt.calibration.map(c => '<div class="rd-kv"><span>' + Math.round(c[0] * 100) + '–' + Math.round(c[1] * 100) + '% · ' + c[2] + ' months</span><b>' + Math.round(c[4] * 100) + '% → ' + Math.round(c[3] * 100) + '%</b></div>').join('') + '</div>' +
      '<div><h4>CURRENT DRIVERS (LOGIT UNITS)</h4>' + d.us.contributions.map(c => '<div class="rd-kv"><span>' + esc(c.id) + ' = ' + num(c.value, 2) + ' (z ' + sgn(c.z, 2) + ')</span><b class="' + (c.logit > 0 ? 'c-red' : 'c-green') + '">' + sgn(c.logit, 2) + '</b></div>').join('') +
      '<p class="fineprint">Positive = pushes probability up. Only the US has enough dated recessions for a fitted model; the global and country layers are rule-based on official leading indicators and are labelled as such. FRED series are revised data, not real-time vintages. Exogenous shocks (e.g. COVID-19) are not forecastable.</p></div>' +
      '</div></section>');

    $('radar-root').innerHTML = html.join('');
    renderCountries();
    $('rd-ctry').addEventListener('click', e => { const tr = e.target.closest('tr[data-iso]'); if (!tr) return; S.dossier = tr.dataset.iso; renderDossier(); $('rd-dossier-panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('rd-regions').addEventListener('click', e => { const b = e.target.closest('button[data-region]'); if (!b) return; S.region = b.dataset.region; $('rd-regions').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); renderCountries(); });
    drawCharts();
    renderChanges();
    const mt = $('rd-wm-tools'); if (mt) mt.addEventListener('click', e => { const b = e.target.closest('button[data-wm]'); if (!b) return; if (b.dataset.wm === 'eu' || b.dataset.wm === 'world') { S.wmView = b.dataset.wm; } else { S.wmMetric = b.dataset.wm; } mt.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.wm === S.wmMetric || x.dataset.wm === S.wmView)); drawWorldMap(); });
    drawWorldMap();
    renderDossier();
    loadExtra();
  }

  /* ---------------- non-economic & structural layer (World Bank WDI/WGI) ---------------- */
  const EXTRA = [
    ['VC.BTL.DETH', 'Battle-related deaths (conflict)', 'n', 'SECURITY & POLITICS', v => Math.min(100, Math.log10(1 + v) * 25)],
    ['MS.MIL.XPND.GD.ZS', 'Military expenditure / GDP', '%', 'SECURITY & POLITICS', v => Math.min(100, Math.max(0, (v - 1) / 5 * 100))],
    ['VC.IHR.PSRC.P5', 'Intentional homicides per 100k', '', 'SECURITY & POLITICS', v => Math.min(100, Math.max(0, (v - 1) / 29 * 100))],
    ['SN.ITK.MSFI.ZS', 'Moderate/severe food insecurity', '%', 'FOOD, HEALTH & DEMOGRAPHY', v => Math.min(100, Math.max(0, (v - 5) / 55 * 100))],
    ['SP.DYN.LE00.IN', 'Life expectancy at birth', 'yrs', 'FOOD, HEALTH & DEMOGRAPHY', v => Math.min(100, Math.max(0, (82 - v) / 27 * 100))],
    ['SP.POP.65UP.TO.ZS', 'Population aged 65+', '%', 'FOOD, HEALTH & DEMOGRAPHY', v => Math.min(100, Math.max(0, (v - 10) / 20 * 100))],
    ['SP.POP.GROW', 'Population growth', '%', 'FOOD, HEALTH & DEMOGRAPHY', null],
    ['EG.IMP.CONS.ZS', 'Energy imports, net / energy use', '%', 'ENERGY, CLIMATE & DIGITAL', v => Math.min(100, Math.max(0, v))],
    ['EG.ELC.ACCS.ZS', 'Access to electricity', '%', 'ENERGY, CLIMATE & DIGITAL', v => Math.min(100, Math.max(0, 100 - v))],
    ['IT.NET.USER.ZS', 'Internet users', '%', 'ENERGY, CLIMATE & DIGITAL', null],
    ['BX.TRF.PWKR.DT.GD.ZS', 'Remittances received / GDP', '%', 'EXTERNAL & FINANCE', v => Math.min(100, Math.max(0, (v - 2) / 18 * 100))],
    ['ST.INT.RCPT.XP.ZS', 'Tourism receipts / exports', '%', 'EXTERNAL & FINANCE', v => Math.min(100, Math.max(0, (v - 5) / 35 * 100))],
    ['FS.AST.PRVT.GD.ZS', 'Domestic credit to private sector / GDP', '%', 'EXTERNAL & FINANCE', v => Math.min(100, Math.max(0, (v - 60) / 120 * 100))],
    ['GC.BAL.CASH.GD.ZS', 'Government cash balance / GDP', '%', 'EXTERNAL & FINANCE', v => Math.min(100, Math.max(0, -v / 8 * 100))],
    ['NE.EXP.GNFS.ZS', 'Exports / GDP (trade exposure)', '%', 'EXTERNAL & FINANCE', null],
    ['NY.GDP.PCAP.CD', 'GDP per capita', 'usd', 'EXTERNAL & FINANCE', null]
  ];
  async function loadExtra() {
    if (S.extra || S.extraLoading) return; S.extraLoading = true;
    try {
      const codes = EXTRA.map(e => e[0]); const groups = []; for (let i = 0; i < codes.length; i += 4) groups.push(codes.slice(i, i + 4));
      const res = await Promise.allSettled(groups.map(g => fetch('https://api.worldbank.org/v2/country/all/indicator/' + g.join(';') + '?source=2&format=json&mrnev=1&per_page=20000').then(r => r.json())));
      const out = {}; let n = 0;
      res.forEach(r => { if (r.status !== 'fulfilled' || !Array.isArray(r.value) || !Array.isArray(r.value[1])) return; r.value[1].forEach(p => { const iso = p.countryiso3code, code = p.indicator && p.indicator.id; if (!iso || p.value == null) return; const rec = out[iso] = out[iso] || {}; if (!rec[code] || +p.date > +rec[code].y) { rec[code] = { v: +p.value, y: p.date }; n++; } }); });
      S.extra = out; S.extraN = n;
    } catch (e) { S.extra = {}; S.extraErr = e.message; }
    S.extraLoading = false; renderDossier(); if (['conflict', 'mil', 'food', 'energy'].includes(S.wmMetric)) drawWorldMap();
  }
  window.addEventListener('wf:svi', () => { if (S.data) { renderDossier(); if (['svi', 'social', 'inst', 'pv'].includes(S.wmMetric)) drawWorldMap(); } });
  const SVI = () => (window.FaultlineSVI && window.FaultlineSVI.scores) || null;
  const wbName = iso => { const c = window.FaultlineSVI && window.FaultlineSVI.countries.find(x => x.id === iso); return c ? c.name : null; };
  function pw2(x, pts) { if (x == null) return null; if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return pts[pts.length - 1][1]; }
  function pbar(v) { if (v == null) return '<span class="c-mute">—</span>'; const lv = v >= 60 ? 'red' : v >= 40 ? 'amber' : 'green'; return '<div class="rd-score"><i><b class="bg-' + lv + '" style="width:' + Math.max(2, v) + '%"></b></i><span class="c-' + lv + '">' + Math.round(v) + '</span></div>'; }
  function fmtV(v, u) { if (v == null || !Number.isFinite(v)) return '—'; if (u === 'usd') return '$' + Math.round(v).toLocaleString('en-US'); if (u === 'n') return Math.round(v).toLocaleString('en-US'); return (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) + (u ? (u === '%' ? '%' : ' ' + u) : ''); }
  function renderDossier() {
    const box = $('rd-dossier-panel'); if (!box || !S.data) return;
    const el = loc() === 'el'; const d = S.data;
    S.dossier = S.dossier || 'GRC';
    const iso = S.dossier; const rc = d.countries.find(c => c.iso3 === iso); const sv = SVI() && SVI()[iso]; const ex = S.extra && S.extra[iso];
    const wbList = (window.FaultlineSVI && window.FaultlineSVI.countries) || d.countries.map(c => ({ id: c.iso3, name: c.name }));
    const name = (rc && rc.name) || wbName(iso) || iso;
    const opts = wbList.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => '<option value="' + esc(c.id) + '"' + (c.id === iso ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('');
    const item = (label, val, year, pressure, src) => '<div class="rd-ds-item"><span>' + esc(label) + (src ? '<small>' + esc(src) + '</small>' : '') + '</span><b>' + val + '</b><em>' + esc(year || '') + '</em>' + pbar(pressure) + '</div>';
    const groups = [];
    // Cycle
    const k = rc ? rc.components : {}; const cyc = [];
    if (k.cli) cyc.push(item('OECD composite leading indicator', num(k.cli.value, 2) + ' (' + sgn(k.cli.ch3, 2) + ')', k.cli.month, k.cli.score, k.cli.phase));
    if (k.esi) cyc.push(item('Economic sentiment (ESI)', num(k.esi.value, 1), k.esi.month, k.esi.score, 'Eurostat'));
    if (k.gdp) cyc.push(item('Real GDP q/q, last two quarters', k.gdp.last.map(q => sgn(q.v, 1) + '%').join(' / '), k.gdp.last[k.gdp.last.length - 1].q, k.gdp.score, k.gdp.technical ? 'TECHNICAL RECESSION' : 'Eurostat'));
    if (k.ciss) cyc.push(item('Systemic stress (ECB CISS)', num(k.ciss.value, 3), k.ciss.date, k.ciss.score, '1y max ' + num(k.ciss.max1y, 2)));
    if (k.spread) cyc.push(item('10Y bond spread vs Bund', sgn(k.spread.value, 2) + 'pp', k.spread.month, k.spread.score, 'yield ' + num(k.spread.yield, 2) + '%'));
    const bk = (rc && rc.banking) || (d.banking && d.banking.rows.find(b => b.iso3 === iso));
    const bItems = bk ? [item(el ? 'Πίστωση ιδ. τομέα / ΑΕΠ (BIS)' : 'Private credit / GDP (BIS)', num(bk.credit, 1) + '%', bk.creditDate, null, 'Q' + bk.cc + 'PAM770A'), item(el ? 'Μεταβολή 2 ετών πίστωσης/ΑΕΠ' : '2-year change in credit/GDP', sgn(bk.creditD8, 1) + 'pp', bk.creditDate, pw2(bk.creditD8, [[0, 0], [4, 30], [8, 60], [12, 85], [16, 100]]), 'JST predictor'), item(el ? 'Πραγματικές τιμές κατοικιών, 2 έτη' : 'Real house prices, 2-year change', sgn(bk.house2y, 1) + '%', bk.houseDate, pw2(bk.house2y, [[0, 0], [10, 50], [20, 100]]), 'Q' + bk.cc + 'R628BIS'), item(el ? 'Κατοικίες από την 5ετή κορυφή' : 'House prices vs 5-year peak', sgn(bk.houseFromPeak5y, 1) + '%', bk.houseDate, null, bk.phase), item(el ? 'Παγκόσμια πίστωση (εκτός χώρας)' : 'Global credit growth (leave-one-out)', sgn(bk.globalCreditD8, 1) + 'pp', '', null, 'JST predictor')].join('') : '<p class="muted">' + (el ? 'Δεν υπάρχουν σειρές BIS για αυτή τη χώρα.' : 'No BIS series for this economy.') + '</p>';
    groups.push([(el ? 'ΣΥΣΣΩΡΕΥΣΗ ΤΡΑΠΕΖΙΚΗΣ ΚΡΙΣΗΣ (ΤΥΠΟΥ 2008)' : 'BANKING-CRISIS BUILD-UP (2008-TYPE)') + (bk ? ' · ' + num(bk.score, 0) + '/100' : ''), bItems]);
    groups.push([el ? 'ΚΥΚΛΟΣ & ΑΓΟΡΕΣ (ΖΩΝΤΑΝΑ)' : 'CYCLE & MARKETS (LIVE)', cyc.length ? cyc.join('') : '<p class="muted">' + (el ? 'Καμία μηνιαία/ημερήσια πηγή κύκλου για αυτή τη χώρα.' : 'No monthly/daily cycle source covers this economy.') + '</p>']);
    // SVI domains
    if (sv) Object.values(sv.domains).forEach(dm => { const gname = { economic: el ? 'ΜΑΚΡΟΟΙΚΟΝΟΜΙΚΗ ΠΙΕΣΗ' : 'MACRO PRESSURE', social: el ? 'ΚΟΙΝΩΝΙΑ' : 'SOCIETY', institutional: el ? 'ΘΕΣΜΟΙ & ΠΟΛΙΤΙΚΗ ΣΤΑΘΕΡΟΤΗΤΑ (WGI)' : 'INSTITUTIONS & POLITICAL STABILITY (WGI)' }[dm.key]; groups.push([gname + ' · ' + (dm.value == null ? 'N/A' : dm.value.toFixed(0) + '/100'), dm.parts.map(pt => item(pt.label, pt.value == null ? '—' : fmtV(pt.value, ''), pt.year, pt.stress, pt.reason === 'stale' ? 'STALE' : pt.code)).join('')]); });
    else groups.push([el ? 'ΔΟΜΙΚΑ (WORLD BANK)' : 'STRUCTURAL (WORLD BANK)', '<p class="muted">' + (el ? 'Φόρτωση World Bank WDI/WGI…' : 'Loading World Bank WDI/WGI…') + '</p>']);
    // Extras grouped
    const eg = {}; EXTRA.forEach(e => { const o = ex && ex[e[0]]; (eg[e[3]] = eg[e[3]] || []).push(item(e[1], o ? fmtV(o.v, e[2]) : '—', o ? o.y : '', o && e[4] ? e[4](o.v) : null, e[0])); });
    if (!S.extra) groups.push([el ? 'ΑΣΦΑΛΕΙΑ, ΤΡΟΦΗ, ΕΝΕΡΓΕΙΑ…' : 'SECURITY, FOOD, ENERGY…', '<p class="muted">Loading…</p>']);
    else Object.entries(eg).forEach(([g, items]) => groups.push([g, items.join('')]));
    const total = groups.reduce((a, g) => a + (g[1].match(/rd-ds-item/g) || []).length, 0);
    box.innerHTML = '<div class="panel-head"><div><div class="micro-label">' + (el ? 'ΦΑΚΕΛΟΣ ΧΩΡΑΣ · ' : 'COUNTRY DOSSIER · ') + total + (el ? ' ΔΕΙΚΤΕΣ · ΟΙΚΟΝΟΜΙΑ, ΚΟΙΝΩΝΙΑ, ΘΕΣΜΟΙ, ΑΣΦΑΛΕΙΑ, ΕΝΕΡΓΕΙΑ' : ' INDICATORS · ECONOMY, SOCIETY, INSTITUTIONS, SECURITY, ENERGY') + '</div><h2>' + esc(name) + '</h2></div><label class="inline-select">' + (el ? 'ΧΩΡΑ' : 'ECONOMY') + ' <select id="rd-ds-sel">' + opts + '</select></label></div>' +
      '<div class="rd-ds-head"><div><span>' + (el ? 'ΚΥΚΛΙΚΟ ΣΗΜΑ ΥΦΕΣΗΣ' : 'CYCLICAL RECESSION SIGNAL') + '</span><b class="c-' + (rc ? rc.level : 'mute') + '">' + (rc && rc.score != null ? rc.score : '—') + '</b><small>' + (el ? 'πόσο κοντά σε ύφεση τώρα' : 'how close to recession now') + '</small></div>' +
      '<div><span>' + (el ? 'ΔΟΜΙΚΗ ΕΥΑΛΩΤΟΤΗΤΑ (SVI)' : 'STRUCTURAL VULNERABILITY (SVI)') + '</span><b>' + (sv && sv.value != null ? sv.value.toFixed(0) : '—') + '</b><small>' + (el ? 'πόσο βαθιά θα πονούσε' : 'how hard a shock would hit') + '</small></div>' +
      '<div><span>' + (el ? 'ΟΙΚΟΝ. · ΚΟΙΝ. · ΘΕΣΜ.' : 'ECON · SOCIAL · INSTIT.') + '</span><b>' + (sv ? ['economic', 'social', 'institutional'].map(k2 => sv.domains[k2].value == null ? '—' : sv.domains[k2].value.toFixed(0)).join(' · ') : '—') + '</b><small>0–100 ' + (el ? 'πίεση' : 'pressure') + '</small></div></div>' +
      '<div class="rd-ds-grid">' + groups.map(g => '<div class="rd-ds-group"><h4>' + esc(g[0]) + '</h4>' + g[1] + '</div>').join('') + '</div>' +
      '<p class="fineprint">' + (el ? 'Μπάρες 0–100 = πίεση/ευαλωτότητα με διαφανή όρια (δεν είναι πιθανότητες). Οι δομικοί δείκτες είναι ετήσιοι (World Bank WDI/WGI) και αλλάζουν αργά· το κυκλικό σήμα είναι μηνιαίο/ημερήσιο. Κενά δεν συμπληρώνονται.' : 'Bars 0–100 = pressure/vulnerability via transparent thresholds (not probabilities). Structural indicators are annual (World Bank WDI/WGI) and move slowly; the cyclical signal is monthly/daily. Gaps are never filled.') + '</p>';
    $('rd-ds-sel').onchange = e => { S.dossier = e.target.value; renderDossier(); };
  }

  /* ---------------- how close are we ---------------- */
  function trend(col, n) {
    const rows = S.data.history.rows.filter(r => r[col] != null).slice(-(n || 6)); if (rows.length < 3) return null;
    const xs = rows.map((_, i) => i), ys = rows.map(r => r[col]); const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
    let num_ = 0, den = 0; xs.forEach((x, i) => { num_ += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; }); return den ? num_ / den : null;
  }
  function pillars(d) {
    const el = loc() === 'el';
    const stressNow = d.current.stress;
    const rows = S.data.history.rows; const sCol = rows.map(r => (r[3] == null && r[4] == null ? null : Math.max(r[3] ?? -999, r[4] ?? -999)));
    const sTrend = (() => { const v = sCol.filter(x => x != null).slice(-6); if (v.length < 3) return null; return (v[v.length - 1] - v[0]) / (v.length - 1); })();
    return [
      { id: 'p', label: el ? 'Πιθανότητα ύφεσης ΗΠΑ (12μ)' : 'US recession probability (12m)', unit: '%', x: d.current.p, calm: 5, main: d.verdict.answers.us.alarmThreshold ?? 50, dir: 1, slope: trend(1, 6), dec: 0,
        marks: [[30, el ? 'επιτήρηση' : 'watch']].concat(d.verdict.answers.us.alarmThreshold != null && Math.abs(d.verdict.answers.us.alarmThreshold - 30) > 4 ? [[d.verdict.answers.us.alarmThreshold, el ? 'συναγερμός (Sarlin)' : 'alarm (Sarlin)']] : []).concat([[50, el ? 'κλήση ύφεσης' : 'recession call']]).sort((a, b) => a[0] - b[0]) },
      { id: 'g20', label: el ? 'Πρόδρομος δείκτης G20 (OECD CLI)' : 'G20 leading indicator (OECD CLI)', unit: '', x: d.current.g20, calm: 101, main: 98.8, dir: -1, slope: trend(5, 6), dec: 2,
        marks: [[100, el ? 'τάση' : 'trend'], [99.6, el ? 'επιβράδυνση' : 'slowdown'], [98.8, el ? 'παγκόσμια ύφεση' : 'global recession'], [97.6, el ? 'βαθιά' : 'severe']] },
      { id: 'diff', label: el ? 'Διάχυση συρρίκνωσης (% παγκόσμιου ΑΕΠ)' : 'Downturn diffusion (% of world GDP)', unit: '%', x: d.current.diff, calm: 0, main: 60, dir: 1, slope: trend(6, 6), dec: 0,
        marks: [[45, el ? 'επιβράδυνση' : 'slowdown'], [60, el ? 'συγχρονισμένη ύφεση' : 'synchronised recession']] },
      { id: 'stress', label: el ? 'Χρηματοπιστωτική πίεση (% του 2008)' : 'Financial stress (% of 2008 peak)', unit: '%', x: stressNow, calm: 0, main: 60, dir: 1, slope: sTrend, dec: 0,
        marks: [[35, el ? 'πίεση' : 'stress'], [60, el ? 'συστημική' : 'systemic'], [100, '2008']] }
    ];
  }
  const progress = q => (q.x == null ? null : Math.max(0, Math.min(100, 100 * (q.x - q.calm) / (q.main - q.calm))));
  function proximityHtml(d) {
    const el = loc() === 'el'; const P = pillars(d);
    const prog = P.map(progress).filter(v => v != null); const idx = prog.length ? prog.reduce((a, b) => a + b) / prog.length : null;
    const sys = progress(P[3]) == null ? null : Math.max(0, Math.min(100, 100 * (P[3].x) / 100));
    const tone = idx == null ? 'na' : idx >= 75 ? 'red' : idx >= 45 ? 'amber' : 'green';
    const row = q => {
      const lo = Math.min(q.calm, ...q.marks.map(m => m[0]), q.x ?? q.calm), hi = Math.max(q.calm, ...q.marks.map(m => m[0]), q.x ?? q.calm);
      const span = hi - lo || 1; const pos = v => (q.dir > 0 ? (v - lo) / span : (hi - v) / span) * 100;
      const pr = progress(q); const toward = q.slope == null ? null : q.slope * q.dir;
      let eta;
      if (q.x == null) eta = '—';
      else if ((q.dir > 0 && q.x >= q.main) || (q.dir < 0 && q.x <= q.main)) eta = el ? 'ΣΤΟ ΟΡΙΟ ΤΩΡΑ' : 'AT TRIGGER NOW';
      else if (toward != null && toward > 1e-6) { const m = Math.abs(q.main - q.x) / Math.abs(q.slope); eta = (m > 120 ? '>120' : Math.round(m)) + (el ? ' μήνες με τον τρέχοντα ρυθμό' : ' months at current 6m pace'); }
      else eta = el ? 'απομακρύνεται / σταθερό' : 'moving away / flat';
      const gap = q.x == null ? '—' : (q.dir > 0 ? '+' : '−') + Math.abs(q.main - q.x).toFixed(q.dec || 1) + q.unit;
      return '<div class="rd-prox-row"><div class="rd-prox-lab"><b>' + esc(q.label) + '</b><small>' + (el ? 'τώρα ' : 'now ') + num(q.x, q.dec) + q.unit + ' · 6m ' + (el ? 'κλίση ' : 'slope ') + sgn(q.slope, q.dec ? 3 : 1) + '/mo</small></div>' +
        '<div class="rd-track"><span class="fill" style="width:' + Math.max(0, Math.min(100, pos(q.x ?? q.calm))) + '%"></span>' + q.marks.map((m, mi) => '<em class="' + (mi % 2 ? 'up' : '') + '" style="left:' + pos(m[0]) + '%"><i>' + esc(m[1]) + '</i></em>').join('') + '<span class="dot" style="left:' + Math.max(0, Math.min(100, pos(q.x ?? q.calm))) + '%"></span></div>' +
        '<div class="rd-prox-num"><strong>' + (pr == null ? '—' : Math.round(pr) + '%') + '</strong><small>' + (el ? 'απόσταση ' : 'gap ') + gap + '</small><small>' + esc(eta) + '</small></div></div>';
    };
    return '<section class="panel rd-prox" data-tone="' + tone + '"><div class="panel-head"><div><div class="micro-label">' + (el ? 'ΑΠΟΣΤΑΣΗ ΑΠΟ ΤΑ ΟΡΙΑ ΕΝΕΡΓΟΠΟΙΗΣΗΣ' : 'DISTANCE TO THE TRIGGERS') + '</div><h2>' + (el ? 'Πόσο κοντά είμαστε;' : 'How close are we?') + '</h2></div><span class="panel-hint">0% = ' + (el ? 'ηρεμία' : 'calm') + ' · 100% = ' + (el ? 'όριο ύφεσης' : 'recession trigger') + '</span></div>' +
      '<div class="rd-prox-grid"><div class="rd-prox-big"><div class="rd-q">' + (el ? 'ΔΕΙΚΤΗΣ ΕΓΓΥΤΗΤΑΣ ΥΦΕΣΗΣ' : 'RECESSION PROXIMITY INDEX') + '</div><div class="rd-ring" style="--v:' + (idx ?? 0) + '"><span>' + (idx == null ? '—' : Math.round(idx)) + '<small>/100</small></span></div><p>' +
      (el ? 'Μέσος όρος της προόδου των 4 πυλώνων προς το όριο ύφεσης. Συστημική εγγύτητα (πίεση ως % του 2008): ' : 'Mean progress of the 4 pillars toward their recession trigger. Systemic proximity (stress as % of 2008): ') + '<b>' + (sys == null ? '—' : Math.round(sys) + '%') + '</b></p></div>' +
      '<div class="rd-prox-rows">' + P.map(row).join('') + '</div></div>' +
      '<p class="fineprint">' + (el ? 'Πρόοδος = 100·(x − ηρεμία)/(όριο − ηρεμία), κομμένη στο [0,100]. Οι «μήνες ως το όριο» είναι γραμμική προέκταση της κλίσης 6 μηνών — αριθμητική, όχι πρόβλεψη. Ηρεμία: P 5%, CLI 101, διάχυση 0%, πίεση 0% (μακροχρόνιος διάμεσος).' : 'Progress = 100·(x − calm)/(trigger − calm), clipped to [0,100]. "Months to trigger" is a linear extrapolation of the 6-month slope — arithmetic, not a forecast. Calm anchors: P 5%, CLI 101, diffusion 0%, stress 0% (long-run median).') + '</p></section>';
  }

  /* ---------------- world map ---------------- */
  function worldMapHtml(d) {
    const el = loc() === 'el'; S.wmMetric = S.wmMetric || 'score'; S.wmView = S.wmView || 'world';
    const b = (k, l) => '<button data-wm="' + k + '" class="' + (S.wmMetric === k || S.wmView === k ? 'on' : '') + '">' + l + '</button>';
    return '<section class="panel"><div class="panel-head"><div><div class="micro-label">' + (el ? 'ΠΑΓΚΟΣΜΙΟΣ ΧΑΡΤΗΣ · ' : 'WORLD MAP · ') + d.countries.length + (el ? ' ΟΙΚΟΝΟΜΙΕΣ' : ' ECONOMIES') + '</div><h2>' + (el ? 'Πού σχηματίζεται η ύφεση' : 'Where recession risk is forming') + '</h2></div><div class="rd-tools" id="rd-wm-tools">' +
      b('score', el ? 'ΣΚΟΡ ΥΦΕΣΗΣ' : 'RECESSION SCORE') + b('cli', 'OECD CLI') + b('esi', el ? 'ΣΥΝΑΙΣΘΗΜΑ ESI' : 'SENTIMENT ESI') + b('gdp', el ? 'ΑΕΠ Τ/Τ' : 'GDP Q/Q') + b('ciss', 'CISS') + b('svi', 'SVI') + b('social', el ? 'ΚΟΙΝΩΝΙΑ' : 'SOCIAL') + b('inst', el ? 'ΘΕΣΜΟΙ' : 'INSTITUTIONS') + b('pv', el ? 'ΠΟΛ. ΣΤΑΘΕΡΟΤΗΤΑ' : 'POL. STABILITY') + b('conflict', el ? 'ΣΥΓΚΡΟΥΣΕΙΣ' : 'CONFLICT') + b('mil', el ? 'ΑΜΥΝΑ %ΑΕΠ' : 'MILITARY %GDP') + b('food', el ? 'ΕΠΙΣΙΤΙΣΤΙΚΗ ΑΝΑΣΦ.' : 'FOOD INSECURITY') + b('energy', el ? 'ΕΝΕΡΓ. ΕΞΑΡΤΗΣΗ' : 'ENERGY IMPORTS') + b('boom', el ? 'ΠΙΣΤΩΤΙΚΗ ΦΟΥΣΚΑ' : 'CREDIT BOOM') + '<span style="width:10px"></span>' + b('world', el ? 'ΚΟΣΜΟΣ' : 'WORLD') + b('eu', el ? 'ΕΥΡΩΠΗ' : 'EUROPE') + '</div></div>' +
      '<div id="rd-world" class="rd-world"></div><p class="fineprint">' + (el ? 'Γκρι = καμία πηγή για τη χώρα (δεν γίνεται εκτίμηση). Κλικ/hover για τα στοιχεία. Πηγές: OECD CLI, Eurostat ESI & ΑΕΠ, ΕΚΤ CISS & spreads.' : 'Grey = no source covers the economy (nothing is imputed). Hover for components. Sources: OECD CLI, Eurostat ESI & GDP, ECB CISS & spreads.') + '</p></section>';
  }
  let GEO = null;
  async function drawWorldMap() {
    const box = $('rd-world'); if (!box || typeof echarts === 'undefined') return;
    try {
      if (!GEO) { const r = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'); if (!r.ok) throw new Error('map layer HTTP ' + r.status); GEO = await r.json(); echarts.registerMap('wf-radar', GEO); }
      const d = S.data, by = {}; d.countries.forEach(c => { by[c.iso3] = c; });
      const metric = S.wmMetric || 'score';
      const sv = SVI() || {}, ex = S.extra || {};
      const exv = (iso3, code) => (ex[iso3] && ex[iso3][code] ? ex[iso3][code].v : null);
      const val2 = iso3 => { const r = sv[iso3]; switch (metric) { case 'svi': return r ? r.value : null; case 'social': return r ? r.domains.social.value : null; case 'inst': return r ? r.domains.institutional.value : null; case 'pv': { const pt = r && r.domains.institutional.parts.find(x => x.code === 'GOV_WGI_PV_SC'); return pt ? pt.value : null; } case 'conflict': { const v = exv(iso3, 'VC.BTL.DETH'); return v == null ? null : Math.log10(1 + v); } case 'mil': return exv(iso3, 'MS.MIL.XPND.GD.ZS'); case 'food': return exv(iso3, 'SN.ITK.MSFI.ZS'); case 'energy': return exv(iso3, 'EG.IMP.CONS.ZS'); case 'boom': { const b = S.data.banking && S.data.banking.rows.find(x => x.iso3 === iso3); return b ? b.score : null; } } return undefined; };
      const val = (c, iso3) => { const v2 = val2(iso3); if (v2 !== undefined) return v2; if (!c) return null; const k = c.components; switch (metric) { case 'score': return c.score; case 'cli': return k.cli ? k.cli.value : null; case 'esi': return k.esi ? k.esi.value : null; case 'gdp': return k.gdp ? k.gdp.last[k.gdp.last.length - 1].v : null; case 'ciss': return k.ciss ? k.ciss.value : null; } return null; };
      const iso = f => f.id || (f.properties && (f.properties.iso_a3 || f.properties.ISO_A3 || f.properties.adm0_a3));
      const data = GEO.features.map(f => { const c = by[iso(f)]; return { name: f.properties.name, iso: iso(f), value: val(c, iso(f)), c }; });
      const VM = { score: { min: 0, max: 100, colors: ['#34d399', '#a3e635', '#fbbf24', '#fb923c', '#f43f5e'] }, cli: { min: 97, max: 102, colors: ['#f43f5e', '#fb923c', '#fbbf24', '#a3e635', '#34d399'] }, esi: { min: 85, max: 110, colors: ['#f43f5e', '#fb923c', '#fbbf24', '#a3e635', '#34d399'] }, gdp: { min: -1, max: 1.5, colors: ['#f43f5e', '#fb923c', '#fbbf24', '#a3e635', '#34d399'] }, ciss: { min: 0, max: 0.3, colors: ['#34d399', '#a3e635', '#fbbf24', '#fb923c', '#f43f5e'] } }[metric] || ({ svi: [10, 55], social: [5, 65], inst: [5, 85], conflict: [0, 4], mil: [0, 6], food: [0, 60], energy: [-100, 100], boom: [0, 100] }[metric] ? (() => { const r = { svi: [10, 55], social: [5, 65], inst: [5, 85], conflict: [0, 4], mil: [0, 6], food: [0, 60], energy: [-100, 100], boom: [0, 100] }[metric]; return { min: r[0], max: r[1], colors: ['#34d399', '#a3e635', '#fbbf24', '#fb923c', '#f43f5e'] }; })() : { min: 0, max: 100, colors: ['#f43f5e', '#fb923c', '#fbbf24', '#a3e635', '#34d399'] });
      if (metric === 'conflict') VM.text = ['10k+ deaths', '0'];
      if (S.charts['rd-world']) S.charts['rd-world'].dispose(); box.innerHTML = '';
      const c = echarts.init(box); S.charts['rd-world'] = c;
      const eu = S.wmView === 'eu';
      c.setOption({ backgroundColor: 'transparent',
        tooltip: Object.assign({ trigger: 'item', formatter: p => { const x = p.data && p.data.c; if (!x) return esc(p.name) + '<br/>' + (p.data && p.data.value != null ? 'value <b>' + num(p.data.value, 1) + '</b>' : '<span style="color:#7f95a1">no source</span>') + '<br/><span style="color:#7f95a1">click → dossier</span>'; const k = x.components; return '<b>' + esc(x.name) + '</b> · score <b>' + (x.score ?? '—') + '</b> (' + x.level + ')<br/>' + (k.cli ? 'CLI ' + k.cli.value + ' (' + sgn(k.cli.ch3, 2) + ', ' + k.cli.phase + ')<br/>' : '') + (k.esi ? 'ESI ' + k.esi.value + ' (' + esc(k.esi.month) + ')<br/>' : '') + (k.gdp ? 'GDP q/q ' + k.gdp.last.map(q => sgn(q.v, 1)).join(' / ') + '<br/>' : '') + (k.ciss ? 'CISS ' + k.ciss.value + '<br/>' : '') + (k.spread ? '10Y vs Bund ' + sgn(k.spread.value, 2) + 'pp' : ''); } }, TT),
        visualMap: { min: VM.min, max: VM.max, calculable: false, orient: 'horizontal', left: 10, bottom: 6, itemWidth: 10, itemHeight: 120, inRange: { color: VM.colors }, text: VM.text || [String(VM.max), String(VM.min)], textStyle: { color: '#8aa7ad', fontSize: 10 } },
        series: [{ type: 'map', map: 'wf-radar', roam: true, zoom: eu ? 4.2 : 1.15, center: eu ? [16, 51] : undefined, scaleLimit: { min: 1, max: 14 }, data, nameProperty: 'name',
          itemStyle: { areaColor: '#161b30', borderColor: '#070912', borderWidth: .5 }, emphasis: { label: { show: false }, itemStyle: { areaColor: '#38bdf8' } }, select: { disabled: true } }] });
      c.on('click', p => { const i = p.data && p.data.iso; if (!i) return; S.dossier = i; renderDossier(); const pnl = $('rd-dossier-panel'); if (pnl) pnl.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    } catch (e) { box.innerHTML = '<div class="chart-no-data">World map layer unavailable: ' + esc(e.message) + '. The country table below has the same data.</div>'; }
  }

  /* ---------------- evidence ledger (Dinakus 2026) ---------------- */
  function evidenceHtml(d) {
    const el = loc() === 'el'; const E = d.evidence; if (!E) return '';
    const bar = (lo, hi, pt, label, cls) => { const x = v => ((v - 0.4) / 0.6 * 100); return '<div class="rd-ci"><span>' + label + '</span><div class="rd-ci-track"><em style="left:' + x(0.5) + '%"></em><i class="' + cls + '" style="left:' + Math.max(0, x(lo)) + '%;width:' + Math.max(1, Math.min(100, x(hi)) - Math.max(0, x(lo))) + '%"></i><b style="left:' + x(pt) + '%"></b></div><small>[' + num(lo, 3) + ', ' + num(hi, 3) + ']</small></div>'; };
    const S5 = E.sarlin;
    return '<section class="panel"><div class="panel-head"><div><div class="micro-label">' + (el ? 'ΜΟΝΑΔΑ ΑΠΟΔΕΙΞΗΣ = ΕΠΕΙΣΟΔΙΟ, ΟΧΙ ΜΗΝΑΣ · DINAKUS (2026)' : 'UNIT OF EVIDENCE = EPISODE, NOT MONTH · DINAKUS (2026)') + '</div><h2>' + (el ? 'Πόση απόδειξη έχουμε στην πραγματικότητα;' : 'How much evidence is there, really?') + '</h2></div><span class="panel-hint">' + esc(E.window) + '</span></div>' +
      '<div class="rd-ev-grid"><div class="rd-ev-kpis">' +
      '<div><span>' + (el ? 'ΜΗΝΕΣ ΑΞΙΟΛΟΓΗΣΗΣ' : 'EVALUATION MONTHS') + '</span><b>' + E.months + '</b><small>' + E.positives + (el ? ' προ-υφεσιακοί' : ' pre-recession') + '</small></div>' +
      '<div><span>' + (el ? 'ΑΝΕΞΑΡΤΗΤΑ ΕΠΕΙΣΟΔΙΑ' : 'INDEPENDENT EPISODES') + '</span><b class="c-amber">' + E.episodes.length + '</b><small>' + E.episodes.join(' · ') + '</small></div>' +
      '<div><span>' + (el ? 'ΕΛΑΧ. ΑΝΙΧΝΕΥΣΙΜΗ ΔΙΑΦΟΡΑ AUROC (80%)' : 'MIN. DETECTABLE AUROC Δ (80% POWER)') + '</span><b class="c-red">' + num(E.mdd80, 2) + '</b><small>' + (el ? 'Πίνακας 5, βαθμονομημένο, ∝1/√K' : 'Table 5, calibrated, ∝1/√K') + '</small></div>' +
      '<div><span>' + (el ? 'ΤΥΠ. ΣΦΑΛΜΑ: ΠΛΗΘΩΡΙΣΜΟΣ' : 'SE INFLATION vs DeLONG') + '</span><b>×' + num(E.seInflation.robust, 2) + '</b><small>' + (el ? 'επεισόδιο + μπλοκ 24μ' : 'episode + 24m blocks') + ' (×' + num(E.seInflation.episode, 2) + ' ' + (el ? 'μόνο επεισόδιο' : 'episode only') + ')</small></div></div>' +
      '<div><h4 class="rd-h4">' + (el ? 'AUROC ' : 'AUROC ') + num(E.auc, 3) + ' — 90% ' + (el ? 'διαστήματα με διαφορετική υπόθεση εξάρτησης' : 'intervals under different dependence assumptions') + '</h4>' +
      bar(E.ciNaive90[0], E.ciNaive90[1], E.auc, 'DeLong (independent months)', 'c1') + bar(E.ciEpisode90[0], E.ciEpisode90[1], E.auc, el ? 'Ομαδοποίηση ανά επεισόδιο' : 'Clustered by episode', 'c2') + bar(E.ciRobust90[0], E.ciRobust90[1], E.auc, el ? 'Επεισόδιο + μπλοκ ηρεμίας 24μ' : 'Episode + 24m tranquil blocks', 'c3') +
      '<p class="fineprint">' + (el ? 'Λευκή γραμμή = 0.5 (τυχαία). Var(Â) κατά Obuchowski (1997), εξ. (1) του paper: προ-υφεσιακοί μήνες ομαδοποιούνται ανά επεισόδιο, ήρεμοι μήνες σε μπλοκ 24 μηνών (μία χώρα — η αυτοσυσχέτιση αντιμετωπίζεται με χρονικά μπλοκ αντί για χώρες).' : 'White line = 0.5 (chance). Var(Â) per Obuchowski (1997), eq. (1) of the paper: pre-recession months clustered by episode, tranquil months in 24-month blocks (single country, so time blocks replace country clusters).') + '</p></div>' +
      '<div><h4 class="rd-h4">' + (el ? 'ΧΩΡΙΣ ΤΟ ΚΑΘΕ ΕΠΕΙΣΟΔΙΟ' : 'LEAVE ONE EPISODE OUT') + '</h4>' + E.leaveOneEpisodeOut.map(x => '<div class="rd-kv"><span>' + (el ? 'χωρίς ' : 'without ') + esc(x.episode) + '</span><b class="' + (x.auc < E.auc - 0.03 ? 'c-red' : x.auc > E.auc + 0.03 ? 'c-green' : '') + '">' + num(x.auc, 3) + '</b></div>').join('') +
      '<h4 class="rd-h4" style="margin-top:14px">' + (el ? 'ΚΑΝΟΝΕΣ ΒΑΘΜΟΛΟΓΗΣΗΣ' : 'PROPER SCORING RULES') + '</h4><div class="rd-kv"><span>Brier (' + (el ? 'κλιματολογία' : 'climatology') + ')</span><b>' + num(E.scores.brier, 4) + ' (' + num(E.scores.brierClimatology, 4) + ')</b></div><div class="rd-kv"><span>Log score (' + (el ? 'κλιματολογία' : 'climatology') + ')</span><b>' + num(E.scores.log, 3) + ' (' + num(E.scores.logClimatology, 3) + ')</b></div><div class="rd-kv"><span>' + (el ? 'Μέση πρόβλεψη vs συχνότητα' : 'Mean forecast vs base rate') + '</span><b>' + num(E.scores.meanForecast, 1) + '% vs ' + num(E.scores.baseRate, 1) + '%</b></div></div>' +
      '<div><h4 class="rd-h4">' + (el ? 'ΧΡΗΣΙΜΟΤΗΤΑ ΓΙΑ ΑΠΟΦΑΣΕΙΣ (SARLIN 2013)' : 'DECISION USEFULNESS (SARLIN 2013)') + '</h4>' + S5.map(x => '<div class="rd-kv"><span>μ = ' + x.mu + (x.mu === 0.5 ? (el ? ' (ισορροπημένος)' : ' (balanced)') : (el ? ' (φοβάται τις χαμένες κρίσεις)' : ' (fears missed crises)')) + '</span><b>τ* ' + Math.round(x.tau * 100) + '% · U<sub>r</sub> ' + num(x.Ur, 2) + '</b></div><div class="rd-kv"><span style="padding-left:12px">' + (el ? 'χαμένα / ψευδείς συναγερμοί' : 'missed / false-alarm rate') + '</span><b>' + Math.round(x.T1 * 100) + '% / ' + Math.round(x.T2 * 100) + '%</b></div>').join('') +
      '<p class="fineprint">L(μ) = μ·T₁·P₁ + (1−μ)·T₂·P₂ · U<sub>r</sub> = (min(μP₁,(1−μ)P₂) − L) / min(μP₁,(1−μ)P₂). ' + (el ? 'Το τ* με μ=0.8 (ο φορέας πολιτικής φοβάται περισσότερο μια χαμένη ύφεση από έναν ψευδή συναγερμό) είναι το όριο συναγερμού παραπάνω. Με μ=0.5 και συχνότητα ~11%, κανένα όριο δεν νικά το «ποτέ συναγερμός» (U<sub>r</sub>=0).' : 'τ* at μ=0.8 (a policymaker who fears a missed recession more than a false alarm) is the alarm threshold used above. At μ=0.5 with an ~11% base rate no threshold beats never signalling (U<sub>r</sub>=0).') + '</p></div></div>' +
      '<div class="rd-callout">' + (el ? '<b>Τι σημαίνει:</b> με ' + E.episodes.length + ' ανεξάρτητα επεισόδια, διαφορές AUROC κάτω από ~' + num(E.mdd80, 2) + ' δεν ανιχνεύονται — γι’ αυτό το εργαλείο δεν «ανταγωνίζει» μοντέλα ML και κρατά ένα σταθερό, ερμηνεύσιμο logit (το πιο σταθερό σε κάθε υπο-περίοδο στο paper). Το παγκόσμιο επίπεδο στηρίζεται σε 5 κύματα (1975, 1982, 1991, 2009, 2020)· κανένα τεστ δεν ελέγχει σωστά το μέγεθος όταν οι κρίσεις έρχονται σε κύματα, άρα εκεί χρησιμοποιούμε δηλωμένους κανόνες, όχι εκτιμήσεις.' : '<b>What this means:</b> with ' + E.episodes.length + ' independent episodes, AUROC differences below ~' + num(E.mdd80, 2) + ' are undetectable — so the tool does not run a model horse race and keeps one stable, interpretable logit (the most stable model across sub-periods in the paper). The global layer rests on 5 waves (1975, 1982, 1991, 2009, 2020); no test controls size when crises arrive in waves, so that layer uses declared rules, not estimates.') + '</div></section>';
  }

  /* ---------------- live equations ---------------- */
  function equationsHtml(d) {
    const el = loc() === 'el'; const m = d.us.model, C = d.us.contributions;
    const eta = m.beta[0] + C.reduce((a, c) => a + (c.logit || 0), 0); const Pn = 1 / (1 + Math.exp(-eta));
    const f = (x, k = 2) => (x == null ? '—' : (x < 0 ? '−' : '') + Math.abs(x).toFixed(k));
    const zLines = C.map((c, j) => 'z(' + c.id + ') = (' + f(c.value) + ' − ' + f(m.mean[j], 3) + ') / ' + f(m.sd[j], 3) + ' = ' + f(c.z)).join('<br/>');
    const etaLine = 'η = ' + f(m.beta[0]) + C.map((c, j) => ' ' + (m.beta[j + 1] < 0 ? '−' : '+') + ' ' + Math.abs(m.beta[j + 1]).toFixed(3) + '·(' + f(c.z) + ')').join('') + ' = <b>' + f(eta, 3) + '</b>';
    const pLine = 'P = 1 / (1 + e<sup>−η</sup>) = 1 / (1 + e<sup>' + f(-eta, 3) + '</sup>) = <b>' + (Pn * 100).toFixed(1) + '%</b>';
    const logit = p => Math.log(p / (1 - p));
    const need = target => C.map((c, j) => { const b = m.beta[j + 1]; const zs = c.z + (logit(target) - eta) / b; return { id: c.id, x: m.mean[j] + m.sd[j] * zs }; });
    const n30 = need(0.30), n50 = need(0.50);
    const names = { spread: el ? 'Spread 10Y−3M' : '10Y−3M spread', spreadMin24: el ? 'Ελάχιστο spread 24μ' : '24m minimum spread', nfci: 'NFCI' };
    const inv = '<table class="rd-table" style="margin-top:8px"><thead><tr><th>' + (el ? 'ΜΕΤΑΒΛΗΤΗ (ΜΟΝΗ ΤΗΣ)' : 'VARIABLE (ALONE)') + '</th><th>' + (el ? 'ΤΩΡΑ' : 'NOW') + '</th><th>' + (el ? 'ΓΙΑ P = 30%' : 'FOR P = 30%') + '</th><th>' + (el ? 'ΓΙΑ P = 50%' : 'FOR P = 50%') + '</th><th>' + (el ? 'ΑΝΑΦΟΡΑ' : 'REFERENCE') + '</th></tr></thead><tbody>' +
      C.map((c, j) => '<tr><td>' + esc(names[c.id] || c.id) + '</td><td class="mono">' + f(c.value) + '</td><td class="mono c-amber">' + f(n30[j].x) + '</td><td class="mono c-red">' + f(n50[j].x) + '</td><td class="mono c-mute">' + ({ spread: el ? '2007: ≈ −0.5 · 2023: ≈ −1.6' : '2007: ≈ −0.5 · 2023: ≈ −1.6', spreadMin24: el ? 'κινείται μόνο προς τα κάτω' : 'can only ratchet down', nfci: el ? '2008 κορύφωση ≈ 3.0' : '2008 peak ≈ 3.0' }[c.id] || '') + '</td></tr>').join('') + '</tbody></table>';
    const us = d.stress.us;
    const sLines = us.components.map(c => 'S(' + c.id + ') = 100·(' + f(c.value, 2) + ' − ' + f(c.baseline, 2) + ') / (' + f(c.gfcPeak, 2) + ' − ' + f(c.baseline, 2) + ') = ' + f(c.pctOf2008, 1) + '%').join('<br/>');
    const ea = d.stress.ea;
    const eaLine = ea.baseline != null ? 'S(CISS<sub>EA</sub>) = 100·(x − ' + f(ea.baseline, 3) + ') / (' + f(ea.gfcPeakMonthly, 3) + ' − ' + f(ea.baseline, 3) + ') = ' + f(ea.current, 1) + '%' : '';
    const g = d.global; const w = g.weights || {}; const inC = g.countries.filter(c => c.phase === 'contraction' || (c.cli != null && c.cli < 100 && c.ch3 < 0));
    const totW = g.countries.filter(c => c.cli != null && c.ch3 != null).reduce((a, c) => a + (w[c.iso3] || 0), 0);
    const dLine = 'D = Σ w<sub>i</sub>·1[CLI<sub>i</sub> &lt; 100 ∧ ΔCLI<sub>i,3m</sub> &lt; 0] / Σ w<sub>i</sub> = (' + (inC.map(c => c.iso3 + ' ' + (w[c.iso3] || 0)).join(' + ') || '0') + ') / ' + totW.toFixed(1) + ' = <b>' + f(g.diffusion.value, 0) + '%</b>';
    const blk = (title, body, note) => '<div class="rd-eq"><h4>' + title + '</h4><div class="equation">' + body + '</div>' + (note ? '<p class="fineprint">' + note + '</p>' : '') + '</div>';
    return '<section class="panel"><div class="panel-head"><div><div class="micro-label">' + (el ? 'ΖΩΝΤΑΝΕΣ ΕΞΙΣΩΣΕΙΣ · ΜΕ ΤΙΣ ΤΡΕΧΟΥΣΕΣ ΤΙΜΕΣ' : 'LIVE EQUATIONS · CURRENT VALUES SUBSTITUTED') + '</div><h2>' + (el ? 'Οι εξισώσεις πίσω από κάθε αριθμό' : 'The equations behind every number') + '</h2></div><span class="panel-hint">' + esc(d.us.latest ? d.us.latest.month : '') + '</span></div><div class="rd-eq-grid">' +
      blk(el ? '① ΠΙΘΑΝΟΤΗΤΑ ΥΦΕΣΗΣ ΗΠΑ (LOGIT ΜΕ RIDGE)' : '① US RECESSION PROBABILITY (RIDGE LOGIT)', 'P(ύφεση<sub>t+1…t+12</sub>) = σ(β<sub>0</sub> + Σ β<sub>j</sub>·z<sub>j</sub>)<br/><br/>' + zLines + '<br/><br/>' + etaLine + '<br/>' + pLine,
        el ? 'β εκτιμήθηκαν με penalized MLE: max Σ[y·ln P + (1−y)·ln(1−P)] − (λ/2)·Σβ<sub>j</sub><sup>2</sup>, λ = 32, Newton–IRLS.' : 'β estimated by penalised MLE: max Σ[y·ln P + (1−y)·ln(1−P)] − (λ/2)·Σβ<sub>j</sub><sup>2</sup>, λ = 32, Newton–IRLS.') +
      blk(el ? '② ΑΝΤΙΣΤΡΟΦΗ: ΤΙ ΧΡΕΙΑΖΕΤΑΙ ΓΙΑ ΝΑ ΑΝΑΨΕΙ;' : '② INVERSION: WHAT WOULD IT TAKE?', 'x<sub>j</sub>* = μ<sub>j</sub> + σ<sub>j</sub>·[ z<sub>j</sub> + (logit(P*) − η) / β<sub>j</sub> ]<br/>logit(0.30) = −0.847 · logit(0.50) = 0' + inv,
        el ? 'Κάθε γραμμή: πόσο πρέπει να κινηθεί ΜΟΝΗ της η μεταβλητή (οι άλλες σταθερές) για να φτάσει το μοντέλο το 30% / 50%.' : 'Each row: how far that variable alone (others fixed) must move for the model to reach 30% / 50%.') +
      blk(el ? '③ ΠΙΕΣΗ ΩΣ % ΤΟΥ 2008' : '③ STRESS AS % OF THE 2008 PEAK', 'S<sub>k</sub> = 100·(x<sub>k</sub> − median<sub>1990–2019</sub>) / (max<sub>2007–09</sub> − median)<br/><br/>' + sLines + '<br/>S<sub>US</sub> = mean(S<sub>k</sub>) = <b>' + f(us.current, 1) + '%</b><br/>' + eaLine + '<br/>S = max(S<sub>US</sub>, S<sub>EA</sub>) = <b>' + f(d.current.stress, 1) + '%</b>') +
      blk(el ? '④ ΠΑΓΚΟΣΜΙΑ ΔΙΑΧΥΣΗ ΣΥΡΡΙΚΝΩΣΗΣ' : '④ GLOBAL DOWNTURN DIFFUSION', dLine + '<br/><br/>' + (el ? 'Όριο παγκόσμιας ύφεσης: ' : 'Global-recession rule: ') + 'CLI<sub>G20</sub> &lt; 98.8 ∧ D ≥ 60%<br/>' + (el ? 'Τώρα: ' : 'Now: ') + 'CLI<sub>G20</sub> = ' + f(g.g20.value, 2) + ', D = ' + f(g.diffusion.value, 0) + '%', el ? 'Βάρη w = ονομαστικό ΑΕΠ 2024 (τρισ. $), σταθερά ώστε η ιστορία να είναι συγκρίσιμη.' : 'Weights w = 2024 nominal GDP (USD tn), fixed so history is comparable.') +
      blk(el ? '⑤ ΣΚΟΡ ΥΦΕΣΗΣ ΧΩΡΑΣ' : '⑤ COUNTRY RECESSION SCORE', 'Score<sub>c</sub> = Σ ω<sub>k</sub>·g<sub>k</sub>(x<sub>c,k</sub>) / Σ ω<sub>k</sub><br/>ω = 2 (CLI, ESI, ΑΕΠ) · 1 (CISS, spread)<br/>g<sub>CLI</sub>: 101→0, 100→30, 99→55, 98→80, ≤97→100 (+15 αν πέφτει)<br/>g<sub>ΑΕΠ</sub> = 100 αν δύο αρνητικά τρίμηνα', el ? 'Κανόνες, όχι εκτίμηση ανά χώρα — δεν υπάρχουν αρκετές χρονολογημένες υφέσεις για κάθε οικονομία.' : 'Rules, not per-country fits — there are too few dated recessions per economy.') +
      blk(el ? '⑥ ΔΕΙΚΤΗΣ ΕΓΓΥΤΗΤΑΣ' : '⑥ PROXIMITY INDEX', 'π<sub>k</sub> = clip<sub>[0,100]</sub>( 100·(x<sub>k</sub> − calm<sub>k</sub>) / (trigger<sub>k</sub> − calm<sub>k</sub>) )<br/>Π = (π<sub>P</sub> + π<sub>CLI</sub> + π<sub>D</sub> + π<sub>S</sub>) / 4<br/>T<sub>k</sub> = (trigger<sub>k</sub> − x<sub>k</sub>) / slope<sub>k,6m</sub>') +
      '</div></section>';
  }

  function card(q, big, unit, level, text, gaugeHtml) {
    return '<div class="rd-answer"><div class="rd-q">' + esc(q) + '</div><div class="rd-big">' + big + (unit ? '<small>' + esc(unit) + '</small>' : '') + '</div><span class="rd-level ' + lvlClass(level) + '">' + esc(t().lvl[level] || level) + '</span>' + (gaugeHtml || '') + '<p>' + text + '</p></div>';
  }
  function gauge(pct, mark) { if (pct == null) return ''; return '<div class="rd-gauge"><i style="width:' + Math.max(2, Math.min(100, pct)) + '%"></i>' + (mark != null ? '<em style="left:' + Math.min(99, mark) + '%"></em>' : '') + '</div>'; }
  function spark(arr) {
    const v = (arr || []).filter(x => x != null && Number.isFinite(x)); if (v.length < 3) return '';
    const a = arr.map(x => (x == null ? null : x)); const mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1;
    const pts = a.map((x, i) => (x == null ? null : (i / (a.length - 1) * 96).toFixed(1) + ',' + (28 - (x - mn) / rg * 26).toFixed(1))).filter(Boolean).join(' ');
    return '<svg viewBox="0 0 96 30" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="#38bdf8" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>';
  }
  function sigCard(s) {
    const st = { ok: 'OK', watch: 'WATCH', alert: 'ALERT', na: 'N/A' }[s.status] || s.status;
    return '<div class="rd-sig ' + esc(s.status) + '"><div class="rd-sig-top"><span>' + esc(s.id) + ' · ' + esc(s.date || '—') + '</span><span class="st">' + st + '</span></div><h4>' + esc(s.label) + '</h4><div class="rd-sig-val"><strong>' + (s.value == null ? '—' : esc(s.value)) + '<small>' + esc(s.unit) + '</small></strong>' + spark(s.spark) + '</div>' + (s.extra ? '<p style="color:#b9c9cf">' + esc(s.extra) + '</p>' : '') + '<p>' + esc(s.rule) + '</p></div>';
  }
  function scoreBar(v, level) { if (v == null) return '<span class="c-mute">—</span>'; return '<div class="rd-score"><i><b class="bg-' + level + '" style="width:' + v + '%"></b></i><span class="c-' + level + '">' + v + '</span></div>'; }
  function renderCountries() {
    const d = S.data; const rows = d.countries.filter(c => S.region === 'all' || c.region === S.region);
    const ph = { expansion: ['EXPANSION', 'c-green'], downturn: ['DOWNTURN', 'c-amber'], contraction: ['CONTRACTION', 'c-red'], recovery: ['RECOVERY', 'c-green'] };
    $('rd-ctry').innerHTML = rows.map(c => {
      const k = c.components; const cli = k.cli, esi = k.esi, gdp = k.gdp, ciss = k.ciss, sp = k.spread;
      const phase = cli && cli.phase ? '<span class="' + ph[cli.phase][1] + '">' + ph[cli.phase][0] + '</span>' : '<span class="c-mute">—</span>';
      return '<tr data-iso="' + esc(c.iso3) + '" style="cursor:pointer" class="' + (c.iso3 === 'GRC' ? 'hl' : '') + '"><td class="cname"><b>' + esc(c.name) + '</b><small>' + esc(c.iso3) + ' · ' + esc(c.region) + ' · ' + c.coverage + ' src</small></td><td>' + scoreBar(c.score, c.level) + '</td>' +
        '<td class="mono">' + (cli ? num(cli.value, 2) + ' <span class="' + (cli.ch3 < 0 ? 'c-red' : 'c-green') + '">' + sgn(cli.ch3, 2) + '</span>' : '—') + '</td><td class="mono">' + phase + '</td>' +
        '<td class="mono">' + (esi ? num(esi.value, 1) + ' <span class="' + ((esi.ch3 || 0) < 0 ? 'c-red' : 'c-green') + '">' + sgn(esi.ch3, 1) + '</span> <small class="c-mute">' + esc(esi.month) + '</small>' : '—') + '</td>' +
        '<td class="mono">' + (gdp ? gdp.last.map(q => '<span class="' + (q.v < 0 ? 'c-red' : q.v < 0.2 ? 'c-amber' : 'c-green') + '">' + sgn(q.v, 1) + '</span>').join(' / ') + ' <small class="c-mute">' + esc(gdp.last[gdp.last.length - 1].q) + '</small>' + (gdp.technical ? ' <span class="rd-tag red">TECH. RECESSION</span>' : '') : '—') + '</td>' +
        '<td class="mono">' + (ciss ? num(ciss.value, 3) + ' <small class="c-mute">1y max ' + num(ciss.max1y, 2) + '</small>' : '—') + '</td>' +
        '<td class="mono">' + (sp ? sgn(sp.value, 2) + 'pp <small class="c-mute">' + esc(sp.month) + '</small>' : '—') + '</td>' +
        '<td class="mono">' + (c.banking ? '<span class="c-' + (c.banking.level === 'n/a' ? 'mute' : c.banking.level) + '">' + num(c.banking.score, 0) + '</span> <small class="c-mute">Δcr ' + sgn(c.banking.creditD8, 1) + 'pp · HP ' + sgn(c.banking.house2y, 1) + '%</small>' : '—') + '</td></tr>';
    }).join('') || '<tr><td colspan="9" class="muted">No economies.</td></tr>';
  }

  /* ---------------- charts ---------------- */
  const AX = { axisLabel: { color: '#8b93b8', fontSize: 10 }, axisLine: { lineStyle: { color: '#252b45' } }, splitLine: { lineStyle: { color: '#1b2036', type: 'dashed' } } };
  const TT = { backgroundColor: '#0e1222', borderColor: '#3b4370', textStyle: { color: '#eef1ff', fontSize: 11 } };
  function chart(id) { const el = $(id); if (!el || typeof echarts === 'undefined') return null; if (S.charts[id]) S.charts[id].dispose(); const c = echarts.init(el); S.charts[id] = c; return c; }
  function recAreas(rows) { const out = []; let s = null; rows.forEach((r, i) => { if (r[2] === 1 && s == null) s = r[0]; if (r[2] !== 1 && s != null) { out.push([{ xAxis: s }, { xAxis: rows[i - 1][0] }]); s = null; } }); if (s) out.push([{ xAxis: s }, { xAxis: rows[rows.length - 1][0] }]); return out; }
  function drawCharts() {
    const d = S.data; if (typeof echarts === 'undefined') { ['rd-map', 'rd-us', 'rd-stress', 'rd-cycle'].forEach(id => { const el = $(id); if (el) el.innerHTML = '<div class="chart-no-data">Chart library unavailable.</div>'; }); return; }
    const rows = d.history.rows; const months = rows.map(r => r[0]); const areas = recAreas(rows);
    const shade = { silent: true, itemStyle: { color: 'rgba(244,63,94,.09)' }, data: areas };
    // US probability
    const oosStart = months.indexOf(d.us.oos.start); const oos = months.map((m, i) => (i >= oosStart && d.us.oos.series[i - oosStart] !== undefined ? d.us.oos.series[i - oosStart] : null));
    let c = chart('rd-us');
    if (c) c.setOption({ backgroundColor: 'transparent', grid: { left: 46, right: 18, top: 30, bottom: 50 }, tooltip: Object.assign({ trigger: 'axis', valueFormatter: v => v == null ? '—' : Number(v).toFixed(1) + '%' }, TT), legend: { top: 0, textStyle: { color: '#c3c9e8', fontSize: 10 } },
      xAxis: Object.assign({ type: 'category', data: months, boundaryGap: false }, AX), yAxis: Object.assign({ type: 'value', min: 0, max: 100, axisLabel: { color: '#8b93b8', fontSize: 10, formatter: '{value}%' } }, { splitLine: AX.splitLine }),
      dataZoom: [{ type: 'inside', start: 30 }, { type: 'slider', height: 16, bottom: 8, start: 30, borderColor: '#252b45', textStyle: { color: '#8b93b8' }, fillerColor: 'rgba(245,200,105,.12)' }],
      series: [{ name: 'Fitted probability', type: 'line', data: rows.map(r => r[1]), showSymbol: false, lineStyle: { color: '#f5c869', width: 2 }, areaStyle: { color: 'rgba(245,200,105,.08)' }, markArea: shade, markLine: { silent: true, symbol: 'none', lineStyle: { color: '#fbbf24', type: 'dashed' }, label: { color: '#fbbf24', fontSize: 9, formatter: '50%' }, data: [{ yAxis: 50 }] } },
        { name: 'Pseudo out-of-sample', type: 'line', data: oos, showSymbol: false, connectNulls: false, lineStyle: { color: '#38bdf8', width: 1.2, type: 'dashed' } }] });
    // Stress
    c = chart('rd-stress');
    if (c) c.setOption({ backgroundColor: 'transparent', grid: { left: 46, right: 18, top: 30, bottom: 50 }, tooltip: Object.assign({ trigger: 'axis', valueFormatter: v => v == null ? '—' : Number(v).toFixed(0) + '%' }, TT), legend: { top: 0, textStyle: { color: '#c3c9e8', fontSize: 10 } },
      xAxis: Object.assign({ type: 'category', data: months, boundaryGap: false }, AX), yAxis: Object.assign({ type: 'value', axisLabel: { color: '#8b93b8', fontSize: 10, formatter: '{value}%' } }, { splitLine: AX.splitLine }),
      dataZoom: [{ type: 'inside', start: 45 }, { type: 'slider', height: 16, bottom: 8, start: 45, borderColor: '#252b45', textStyle: { color: '#8b93b8' }, fillerColor: 'rgba(245,200,105,.12)' }],
      series: [{ name: 'US (NFCI · Baa · VIX · STLFSI)', type: 'line', data: rows.map(r => r[3]), showSymbol: false, lineStyle: { color: '#fbbf24', width: 1.8 }, markArea: shade, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 100, lineStyle: { color: '#f43f5e', type: 'solid' }, label: { formatter: '2008 PEAK', color: '#f43f5e', fontSize: 9 } }, { yAxis: 60, lineStyle: { color: '#f43f5e', type: 'dashed', opacity: .6 }, label: { formatter: 'SYSTEMIC 60%', color: '#f43f5e', fontSize: 9 } }, { yAxis: 35, lineStyle: { color: '#fbbf24', type: 'dashed', opacity: .6 }, label: { formatter: 'WATCH 35%', color: '#fbbf24', fontSize: 9 } }] } },
        { name: 'Euro area (ECB CISS)', type: 'line', data: rows.map(r => r[4]), showSymbol: false, lineStyle: { color: '#38bdf8', width: 1.5 } }] });
    // Cycle
    c = chart('rd-cycle');
    if (c) c.setOption({ backgroundColor: 'transparent', grid: { left: 46, right: 44, top: 30, bottom: 50 }, tooltip: Object.assign({ trigger: 'axis' }, TT), legend: { top: 0, textStyle: { color: '#c3c9e8', fontSize: 10 } },
      xAxis: Object.assign({ type: 'category', data: months, boundaryGap: false }, AX),
      yAxis: [Object.assign({ type: 'value', min: 88, max: 103, axisLabel: { color: '#8b93b8', fontSize: 10 } }, { splitLine: AX.splitLine }), { type: 'value', min: 0, max: 100, position: 'right', axisLabel: { color: '#6b7399', fontSize: 9, formatter: '{value}%' }, splitLine: { show: false } }],
      dataZoom: [{ type: 'inside', start: 40 }, { type: 'slider', height: 16, bottom: 8, start: 40, borderColor: '#252b45', textStyle: { color: '#8b93b8' }, fillerColor: 'rgba(245,200,105,.12)' }],
      series: [{ name: 'Downturn diffusion (% GDP)', type: 'line', yAxisIndex: 1, data: rows.map(r => r[6]), showSymbol: false, lineStyle: { width: 0 }, areaStyle: { color: 'rgba(244,63,94,.16)' } },
        { name: 'G20 CLI', type: 'line', data: rows.map(r => r[5]), showSymbol: false, lineStyle: { color: '#f5c869', width: 2 }, markArea: shade, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 100, lineStyle: { color: '#5c7380' }, label: { formatter: 'TREND', color: '#8b93b8', fontSize: 9 } }, { yAxis: 99.6, lineStyle: { color: '#fbbf24', type: 'dashed' }, label: { formatter: 'SLOWDOWN', color: '#fbbf24', fontSize: 9 } }, { yAxis: 98.8, lineStyle: { color: '#f43f5e', type: 'dashed' }, label: { formatter: 'GLOBAL RECESSION', color: '#f43f5e', fontSize: 9 } }] } }] });
    // Crisis map
    c = chart('rd-map');
    if (c) {
      const trail = rows.slice(-24).map(r => [r[1], Math.max(r[3] ?? -999, r[4] ?? -999) === -999 ? null : Math.max(r[3] ?? -999, r[4] ?? -999), r[0]]).filter(p => p[0] != null && p[1] != null);
      const eps = d.episodes.filter(e => e.vec && e.vec.p != null && e.vec.stress != null);
      const col = e => (e.systemic ? '#f43f5e' : e.global ? '#fbbf24' : '#38bdf8');
      c.setOption({ backgroundColor: 'transparent', grid: { left: 50, right: 22, top: 18, bottom: 42 },
        tooltip: Object.assign({ trigger: 'item', formatter: p => p.data && p.data.name ? esc(p.data.name) + '<br/>P ' + num(p.data.value[0], 0) + '% · stress ' + num(p.data.value[1], 0) + '%' : esc(p.data[2] || '') + '<br/>P ' + num(p.data[0], 0) + '% · stress ' + num(p.data[1], 0) + '%' }, TT),
        xAxis: Object.assign({ type: 'value', min: 0, max: 100, name: 'US recession probability, 12m (%)', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: '#8b93b8', fontSize: 10 } }, AX),
        yAxis: Object.assign({ type: 'value', min: -30, max: 130, name: 'Stress, % of 2008', nameTextStyle: { color: '#8b93b8', fontSize: 10 } }, AX),
        series: [
          { type: 'scatter', symbolSize: 11, data: eps.map(e => ({ name: e.name, value: [e.vec.p, e.vec.stress], itemStyle: { color: col(e), opacity: .85 } })), label: { show: true, formatter: p => p.data.name.split(' ')[0], position: 'right', color: '#c3c9e8', fontSize: 9 },
            markArea: { silent: true, data: [[{ xAxis: 40, yAxis: 60, itemStyle: { color: 'rgba(244,63,94,.10)' }, label: { show: true, formatter: 'SYSTEMIC', color: '#f43f5e', fontSize: 9, position: 'insideTopRight' } }, { xAxis: 100, yAxis: 130 }], [{ xAxis: 0, yAxis: 35, itemStyle: { color: 'rgba(251,191,36,.05)' } }, { xAxis: 100, yAxis: 60 }]] } },
          { type: 'line', data: trail, showSymbol: true, symbolSize: (v, p) => (p.dataIndex === trail.length - 1 ? 16 : 4), lineStyle: { color: '#ffffff', width: 1, opacity: .6 }, itemStyle: { color: '#ffffff' }, label: { show: true, formatter: p => (p.dataIndex === trail.length - 1 ? 'NOW' : ''), position: 'top', color: '#ffffff', fontWeight: 'bold', fontSize: 10 } }
        ] });
    }
  }
  function resize() { Object.values(S.charts).forEach(c => c && c.resize()); }

  /* ---------------- public ---------------- */
  window.FaultlineRadar = {
    show() { if (!S.data && !S.loading) load(false); else if (S.data) setTimeout(resize, 30); },
    refresh() { return load(true); },
    rerender() { if (S.data) render(); },
    get data() { return S.data; },
    get extra() { return S.extra || null; },
    load(force) { return load(!!force); }
  };
  window.addEventListener('resize', resize);
  window.addEventListener('wf:locale', () => window.FaultlineRadar.rerender());
  // Continuous refresh: data recomputed server-side at most every 15 min; the page re-pulls every 15 min while visible
  const REFRESH_MS = 15 * 60e3;
  function stamp() {
    const t = $('live-stamp-t'), n = $('live-stamp-n'); if (!t || !S.data) return;
    const el = loc() === 'el'; const g = new Date(S.data.generatedAt);
    const f = d => d.toLocaleString(el ? 'el-GR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const ago = Math.max(0, Math.round((Date.now() - g) / 60e3)); const next = Math.max(0, Math.ceil((REFRESH_MS - (Date.now() - S.loadedAt)) / 60e3));
    t.textContent = (el ? 'Ενημέρωση: ' : 'Updated: ') + f(g);
    n.textContent = ' · ' + (ago < 1 ? (el ? 'μόλις τώρα' : 'just now') : (el ? 'πριν ' + ago + '′' : ago + ' min ago')) + ' · ' + (el ? 'επόμενη σε ' : 'next in ') + next + '′';
    $('live-stamp').title = (el ? 'Τελευταία δεδομένα: ' : 'Latest data: ') + 'US model ' + (S.data.us.latest ? S.data.us.latest.month : '—') + ' · G20 CLI ' + (S.data.global.g20.month || '—') + ' · EA CISS ' + (S.data.stress.ea.latestDaily ? S.data.stress.ea.latestDaily.date : '—');
  }
  setInterval(() => { stamp(); if (document.visibilityState === 'visible' && S.data && Date.now() - S.loadedAt > REFRESH_MS) load(false); }, 30e3);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.data && Date.now() - S.loadedAt > REFRESH_MS) load(false); });
  window.addEventListener('wf:locale', stamp); window.addEventListener('wf:radar', stamp);
})();
