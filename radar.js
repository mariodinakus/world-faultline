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
      S.data = j; S.loadedAt = new Date();
      render();
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
      const j = await p.json(); if (p.ok && !j.error && j.sources.oecd.ok) { S.data = j; render(); }
    } catch (e) { /* keep server result; OECD gap stays disclosed */ }
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

    // Four answers
    const g = A.global;
    html.push('<div class="rd-answers">' +
      card(L.q.global, num(g.g20, 2), 'G20 CLI', g.level, (loc() === 'el' ? 'Πρόδρομος δείκτης G20 (100 = τάση). ' : 'G20 leading indicator (100 = trend). ') + '6m: ' + sgn(g.g20ch6, 2) + ' · ' + (loc() === 'el' ? 'διάχυση συρρίκνωσης ' : 'downturn diffusion ') + num(g.diff, 0) + '% ' + (loc() === 'el' ? 'του ΑΕΠ. Παγκόσμιες υφέσεις: CLI < 98.8 (1991 98.8 · 2009 95.4 · 2020 89.4).' : 'of GDP. Global recessions: CLI < 98.8 (1991 98.8 · 2009 95.4 · 2020 89.4).'), gauge(g.g20 == null ? null : (101 - g.g20) / 6 * 100, (101 - 98.8) / 6 * 100)) +
      card(L.q.systemic, SP == null ? '—' : num(SP, 0) + '<small>% of 2008</small>', '', A.systemic.level, 'US ' + num(A.systemic.us, 0) + '% · Euro area ' + num(A.systemic.ea, 0) + '%. ' + (loc() === 'el' ? '0% = μακροχρόνιος διάμεσος, 100% = κορύφωση 2008 (NFCI, Baa spread, VIX, STLFSI · CISS ΕΚΤ).' : '0% = long-run median, 100% = 2008 peak (NFCI, Baa spread, VIX, STLFSI · ECB CISS).'), gauge(SP, 60)) +
      card(L.q.us, P == null ? '—' : num(P, 0) + '<small>%</small>', '', A.us.level, (loc() === 'el' ? 'Εκτιμημένο logit σε ημερομηνίες NBER, out-of-sample AUC ' : 'Fitted logit on NBER dates, out-of-sample AUC ') + num(d.us.model.backtest.oosAuc, 2) + '. 3m: ' + sgn(d.us.change3m, 1) + 'pp' + (d.us.latest && d.us.latest.partial ? ' · MTD' : ''), gauge(P, 50)) +
      card(L.q.local, String(red.length) + '<small>/ ' + d.countries.length + '</small>', '', A.local.level, red.length ? (loc() === 'el' ? 'Κόκκινο: ' : 'Red: ') + red.map(c => esc(c.name)).join(', ') + (amber.length ? ' · ' + (loc() === 'el' ? 'πορτοκαλί: ' : 'amber: ') + amber.slice(0, 6).map(c => esc(c.name)).join(', ') + (amber.length > 6 ? '…' : '') : '') : (loc() === 'el' ? 'Καμία οικονομία στο κόκκινο. ' : 'No economy in the red. ') + (amber.length ? (loc() === 'el' ? 'Πορτοκαλί: ' : 'Amber: ') + amber.slice(0, 8).map(c => esc(c.name)).join(', ') : ''), gauge(d.countries.length ? 100 * red.length / d.countries.length : null, 25)) +
      '</div>');

    // Map + analogs
    html.push('<div class="rd-row"><section class="panel"><div class="panel-head"><div><div class="micro-label">REGIME SPACE · LAST 24 MONTHS VS. PAST CRISES</div><h2>' + esc(L.map) + '</h2></div></div><div id="rd-map" class="rd-chart tall"></div><div class="rd-legend"><span><i style="background:#e8f0f3"></i>NOW + 24M TRAIL</span><span><i style="background:#ec817b"></i>SYSTEMIC EPISODE</span><span><i style="background:#f3b664"></i>GLOBAL RECESSION</span><span><i style="background:#75cfe7"></i>OTHER EPISODE</span></div></section>' +
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
    html.push('<section class="panel"><div class="panel-head"><div><div class="micro-label">OECD CLI · EUROSTAT ESI & GDP · ECB CISS & BOND SPREADS</div><h2>' + esc(L.countries) + '</h2></div><div class="rd-tools" id="rd-regions">' + regions.map(r => '<button data-region="' + esc(r) + '" class="' + (S.region === r ? 'on' : '') + '">' + esc(r === 'all' ? L.all : r.toUpperCase()) + '</button>').join('') + '</div></div><div class="rd-table-wrap"><table class="rd-table"><thead><tr><th>ECONOMY</th><th>RECESSION SIGNAL</th><th>OECD CLI · 3M</th><th>PHASE</th><th>SENTIMENT (ESI)</th><th>GDP Q/Q · LAST 2</th><th>STRESS (CISS)</th><th>10Y vs BUND</th></tr></thead><tbody id="rd-ctry"></tbody></table></div>' +
      '<p class="fineprint">Score 0–100 = weighted mean of available components (real activity ×2: CLI, ESI, GDP; financial ×1: CISS, sovereign spread). Red ≥60, amber ≥40. Thresholds are transparent rules, not fitted per country: CLI 101→0, 100→30, 99→55, 98→80, ≤97→100 (+15 if falling); ESI 105→0 … ≤85→100; two negative GDP quarters = 100; CISS 0.05→0 … 0.6→100; spread 1pp→0 … 6pp→100.</p></section>');

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
    $('rd-regions').addEventListener('click', e => { const b = e.target.closest('button[data-region]'); if (!b) return; S.region = b.dataset.region; $('rd-regions').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); renderCountries(); });
    drawCharts();
  }

  function card(q, big, unit, level, text, gaugeHtml) {
    return '<div class="rd-answer"><div class="rd-q">' + esc(q) + '</div><div class="rd-big">' + big + (unit ? '<small>' + esc(unit) + '</small>' : '') + '</div><span class="rd-level ' + lvlClass(level) + '">' + esc(t().lvl[level] || level) + '</span>' + (gaugeHtml || '') + '<p>' + text + '</p></div>';
  }
  function gauge(pct, mark) { if (pct == null) return ''; return '<div class="rd-gauge"><i style="width:' + Math.max(2, Math.min(100, pct)) + '%"></i>' + (mark != null ? '<em style="left:' + Math.min(99, mark) + '%"></em>' : '') + '</div>'; }
  function spark(arr) {
    const v = (arr || []).filter(x => x != null && Number.isFinite(x)); if (v.length < 3) return '';
    const a = arr.map(x => (x == null ? null : x)); const mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1;
    const pts = a.map((x, i) => (x == null ? null : (i / (a.length - 1) * 96).toFixed(1) + ',' + (28 - (x - mn) / rg * 26).toFixed(1))).filter(Boolean).join(' ');
    return '<svg viewBox="0 0 96 30" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="#75cfe7" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>';
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
      return '<tr class="' + (c.iso3 === 'GRC' ? 'hl' : '') + '"><td class="cname"><b>' + esc(c.name) + '</b><small>' + esc(c.iso3) + ' · ' + esc(c.region) + ' · ' + c.coverage + ' src</small></td><td>' + scoreBar(c.score, c.level) + '</td>' +
        '<td class="mono">' + (cli ? num(cli.value, 2) + ' <span class="' + (cli.ch3 < 0 ? 'c-red' : 'c-green') + '">' + sgn(cli.ch3, 2) + '</span>' : '—') + '</td><td class="mono">' + phase + '</td>' +
        '<td class="mono">' + (esi ? num(esi.value, 1) + ' <span class="' + ((esi.ch3 || 0) < 0 ? 'c-red' : 'c-green') + '">' + sgn(esi.ch3, 1) + '</span> <small class="c-mute">' + esc(esi.month) + '</small>' : '—') + '</td>' +
        '<td class="mono">' + (gdp ? gdp.last.map(q => '<span class="' + (q.v < 0 ? 'c-red' : q.v < 0.2 ? 'c-amber' : 'c-green') + '">' + sgn(q.v, 1) + '</span>').join(' / ') + ' <small class="c-mute">' + esc(gdp.last[gdp.last.length - 1].q) + '</small>' + (gdp.technical ? ' <span class="rd-tag red">TECH. RECESSION</span>' : '') : '—') + '</td>' +
        '<td class="mono">' + (ciss ? num(ciss.value, 3) + ' <small class="c-mute">1y max ' + num(ciss.max1y, 2) + '</small>' : '—') + '</td>' +
        '<td class="mono">' + (sp ? sgn(sp.value, 2) + 'pp <small class="c-mute">' + esc(sp.month) + '</small>' : '—') + '</td></tr>';
    }).join('') || '<tr><td colspan="8" class="muted">No economies.</td></tr>';
  }

  /* ---------------- charts ---------------- */
  const AX = { axisLabel: { color: '#8298a3', fontSize: 10 }, axisLine: { lineStyle: { color: '#314451' } }, splitLine: { lineStyle: { color: '#1f2e39', type: 'dashed' } } };
  const TT = { backgroundColor: '#11232d', borderColor: '#3b5a66', textStyle: { color: '#e4eff2', fontSize: 11 } };
  function chart(id) { const el = $(id); if (!el || typeof echarts === 'undefined') return null; if (S.charts[id]) S.charts[id].dispose(); const c = echarts.init(el); S.charts[id] = c; return c; }
  function recAreas(rows) { const out = []; let s = null; rows.forEach((r, i) => { if (r[2] === 1 && s == null) s = r[0]; if (r[2] !== 1 && s != null) { out.push([{ xAxis: s }, { xAxis: rows[i - 1][0] }]); s = null; } }); if (s) out.push([{ xAxis: s }, { xAxis: rows[rows.length - 1][0] }]); return out; }
  function drawCharts() {
    const d = S.data; if (typeof echarts === 'undefined') { ['rd-map', 'rd-us', 'rd-stress', 'rd-cycle'].forEach(id => { const el = $(id); if (el) el.innerHTML = '<div class="chart-no-data">Chart library unavailable.</div>'; }); return; }
    const rows = d.history.rows; const months = rows.map(r => r[0]); const areas = recAreas(rows);
    const shade = { silent: true, itemStyle: { color: 'rgba(236,129,123,.09)' }, data: areas };
    // US probability
    const oosStart = months.indexOf(d.us.oos.start); const oos = months.map((m, i) => (i >= oosStart && d.us.oos.series[i - oosStart] !== undefined ? d.us.oos.series[i - oosStart] : null));
    let c = chart('rd-us');
    if (c) c.setOption({ backgroundColor: 'transparent', grid: { left: 46, right: 18, top: 30, bottom: 50 }, tooltip: Object.assign({ trigger: 'axis', valueFormatter: v => v == null ? '—' : Number(v).toFixed(1) + '%' }, TT), legend: { top: 0, textStyle: { color: '#9fb3bd', fontSize: 10 } },
      xAxis: Object.assign({ type: 'category', data: months, boundaryGap: false }, AX), yAxis: Object.assign({ type: 'value', min: 0, max: 100, axisLabel: { color: '#8298a3', fontSize: 10, formatter: '{value}%' } }, { splitLine: AX.splitLine }),
      dataZoom: [{ type: 'inside', start: 30 }, { type: 'slider', height: 16, bottom: 8, start: 30, borderColor: '#263340', textStyle: { color: '#7f95a1' }, fillerColor: 'rgba(92,218,182,.12)' }],
      series: [{ name: 'Fitted probability', type: 'line', data: rows.map(r => r[1]), showSymbol: false, lineStyle: { color: '#5cdab6', width: 2 }, areaStyle: { color: 'rgba(92,218,182,.08)' }, markArea: shade, markLine: { silent: true, symbol: 'none', lineStyle: { color: '#f3b664', type: 'dashed' }, label: { color: '#f3b664', fontSize: 9, formatter: '50%' }, data: [{ yAxis: 50 }] } },
        { name: 'Pseudo out-of-sample', type: 'line', data: oos, showSymbol: false, connectNulls: false, lineStyle: { color: '#75cfe7', width: 1.2, type: 'dashed' } }] });
    // Stress
    c = chart('rd-stress');
    if (c) c.setOption({ backgroundColor: 'transparent', grid: { left: 46, right: 18, top: 30, bottom: 50 }, tooltip: Object.assign({ trigger: 'axis', valueFormatter: v => v == null ? '—' : Number(v).toFixed(0) + '%' }, TT), legend: { top: 0, textStyle: { color: '#9fb3bd', fontSize: 10 } },
      xAxis: Object.assign({ type: 'category', data: months, boundaryGap: false }, AX), yAxis: Object.assign({ type: 'value', axisLabel: { color: '#8298a3', fontSize: 10, formatter: '{value}%' } }, { splitLine: AX.splitLine }),
      dataZoom: [{ type: 'inside', start: 45 }, { type: 'slider', height: 16, bottom: 8, start: 45, borderColor: '#263340', textStyle: { color: '#7f95a1' }, fillerColor: 'rgba(92,218,182,.12)' }],
      series: [{ name: 'US (NFCI · Baa · VIX · STLFSI)', type: 'line', data: rows.map(r => r[3]), showSymbol: false, lineStyle: { color: '#f3b664', width: 1.8 }, markArea: shade, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 100, lineStyle: { color: '#ec817b', type: 'solid' }, label: { formatter: '2008 PEAK', color: '#ec817b', fontSize: 9 } }, { yAxis: 60, lineStyle: { color: '#ec817b', type: 'dashed', opacity: .6 }, label: { formatter: 'SYSTEMIC 60%', color: '#ec817b', fontSize: 9 } }, { yAxis: 35, lineStyle: { color: '#f3b664', type: 'dashed', opacity: .6 }, label: { formatter: 'WATCH 35%', color: '#f3b664', fontSize: 9 } }] } },
        { name: 'Euro area (ECB CISS)', type: 'line', data: rows.map(r => r[4]), showSymbol: false, lineStyle: { color: '#75cfe7', width: 1.5 } }] });
    // Cycle
    c = chart('rd-cycle');
    if (c) c.setOption({ backgroundColor: 'transparent', grid: { left: 46, right: 44, top: 30, bottom: 50 }, tooltip: Object.assign({ trigger: 'axis' }, TT), legend: { top: 0, textStyle: { color: '#9fb3bd', fontSize: 10 } },
      xAxis: Object.assign({ type: 'category', data: months, boundaryGap: false }, AX),
      yAxis: [Object.assign({ type: 'value', min: 88, max: 103, axisLabel: { color: '#8298a3', fontSize: 10 } }, { splitLine: AX.splitLine }), { type: 'value', min: 0, max: 100, position: 'right', axisLabel: { color: '#5f7683', fontSize: 9, formatter: '{value}%' }, splitLine: { show: false } }],
      dataZoom: [{ type: 'inside', start: 40 }, { type: 'slider', height: 16, bottom: 8, start: 40, borderColor: '#263340', textStyle: { color: '#7f95a1' }, fillerColor: 'rgba(92,218,182,.12)' }],
      series: [{ name: 'Downturn diffusion (% GDP)', type: 'line', yAxisIndex: 1, data: rows.map(r => r[6]), showSymbol: false, lineStyle: { width: 0 }, areaStyle: { color: 'rgba(236,129,123,.16)' } },
        { name: 'G20 CLI', type: 'line', data: rows.map(r => r[5]), showSymbol: false, lineStyle: { color: '#5cdab6', width: 2 }, markArea: shade, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 100, lineStyle: { color: '#5c7380' }, label: { formatter: 'TREND', color: '#7f95a1', fontSize: 9 } }, { yAxis: 99.6, lineStyle: { color: '#f3b664', type: 'dashed' }, label: { formatter: 'SLOWDOWN', color: '#f3b664', fontSize: 9 } }, { yAxis: 98.8, lineStyle: { color: '#ec817b', type: 'dashed' }, label: { formatter: 'GLOBAL RECESSION', color: '#ec817b', fontSize: 9 } }] } }] });
    // Crisis map
    c = chart('rd-map');
    if (c) {
      const trail = rows.slice(-24).map(r => [r[1], Math.max(r[3] ?? -999, r[4] ?? -999) === -999 ? null : Math.max(r[3] ?? -999, r[4] ?? -999), r[0]]).filter(p => p[0] != null && p[1] != null);
      const eps = d.episodes.filter(e => e.vec && e.vec.p != null && e.vec.stress != null);
      const col = e => (e.systemic ? '#ec817b' : e.global ? '#f3b664' : '#75cfe7');
      c.setOption({ backgroundColor: 'transparent', grid: { left: 50, right: 22, top: 18, bottom: 42 },
        tooltip: Object.assign({ trigger: 'item', formatter: p => p.data && p.data.name ? esc(p.data.name) + '<br/>P ' + num(p.data.value[0], 0) + '% · stress ' + num(p.data.value[1], 0) + '%' : esc(p.data[2] || '') + '<br/>P ' + num(p.data[0], 0) + '% · stress ' + num(p.data[1], 0) + '%' }, TT),
        xAxis: Object.assign({ type: 'value', min: 0, max: 100, name: 'US recession probability, 12m (%)', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: '#7f95a1', fontSize: 10 } }, AX),
        yAxis: Object.assign({ type: 'value', min: -30, max: 130, name: 'Stress, % of 2008', nameTextStyle: { color: '#7f95a1', fontSize: 10 } }, AX),
        series: [
          { type: 'scatter', symbolSize: 11, data: eps.map(e => ({ name: e.name, value: [e.vec.p, e.vec.stress], itemStyle: { color: col(e), opacity: .85 } })), label: { show: true, formatter: p => p.data.name.split(' ')[0], position: 'right', color: '#9fb3bd', fontSize: 9 },
            markArea: { silent: true, data: [[{ xAxis: 40, yAxis: 60, itemStyle: { color: 'rgba(236,129,123,.10)' }, label: { show: true, formatter: 'SYSTEMIC', color: '#ec817b', fontSize: 9, position: 'insideTopRight' } }, { xAxis: 100, yAxis: 130 }], [{ xAxis: 0, yAxis: 35, itemStyle: { color: 'rgba(243,182,100,.05)' } }, { xAxis: 100, yAxis: 60 }]] } },
          { type: 'line', data: trail, showSymbol: true, symbolSize: (v, p) => (p.dataIndex === trail.length - 1 ? 16 : 4), lineStyle: { color: '#e8f0f3', width: 1, opacity: .6 }, itemStyle: { color: '#e8f0f3' }, label: { show: true, formatter: p => (p.dataIndex === trail.length - 1 ? 'NOW' : ''), position: 'top', color: '#e8f0f3', fontWeight: 'bold', fontSize: 10 } }
        ] });
    }
  }
  function resize() { Object.values(S.charts).forEach(c => c && c.resize()); }

  /* ---------------- public ---------------- */
  window.FaultlineRadar = {
    show() { if (!S.data && !S.loading) load(false); else if (S.data) setTimeout(resize, 30); },
    refresh() { return load(true); },
    rerender() { if (S.data) render(); },
    get data() { return S.data; }
  };
  window.addEventListener('resize', resize);
  window.addEventListener('wf:locale', () => window.FaultlineRadar.rerender());
  setInterval(() => { if (document.visibilityState === 'visible' && S.data && Date.now() - S.loadedAt > 30 * 60e3) load(false); }, 60e3);
})();
