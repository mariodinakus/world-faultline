# PAX · Global Conflict Intelligence

A Greek-language editorial news monitor for international conflicts, peace negotiations, diplomatic developments and opposing indicators of escalation.

## Deployment

Hosted on Vercel from this `pax/` subdirectory of `mariodinakus/world-faultline`. Configure **Root Directory = pax** and **Framework Preset = Other** (static HTML/CSS/JS). News proxy: `pax/api/news.js` → `/api/news?region=ukraine`. No external credentials required. GitHub pushes to main deploy automatically after linking.

## Design

Editorial three-color system: dark ink #171d1f, off-white #f8f7f2, yellow #f1cb36. Uses typography and hierarchy inspired by explanatory journalism, not a copy of a publisher's branding.

## Coverage

Ukraine–Russia, Israel–Gaza, Iran–Israel, U.S.–Iran, Sudan, DRC/M23, Myanmar, Yemen, Syria.

## Data and reliability

Live news headline metadata via Google News RSS, GDELT DOC 2.0 fallback. Both are news discovery sources, **not independent fact-checkers**. No scraped full article text or reproduction of copyrighted news articles.

The **Peace Proximity Index** is an **unvalidated, heuristic headline-signal ratio**, NOT a probability of peace. Headlines are classified by openly defined case-insensitive regex rules. Classified positive weights: negotiations 1; proposals 2; active ceasefire/agreement 3; implemented measures 4. Negative/escalation weight 2.2. Score = 100 * positive / (positive + negative + smoothing 1), rounded to multiples of 5; available only with >=5 articles from >=3 publishers. It is vulnerable to source coverage, wording, selection bias, duplicate reporting and classifier errors. A score is suppressed when coverage is insufficient. **No model calibration, no promise of prediction, no fabricated scores.** Track directional changes only when the browser has a previous observation saved in localStorage.

Conflicts are represented by generalized regional map markers, not live military geolocations.

## Local testing

`npx vercel dev` in `pax/` (with a linked Vercel project) serves the API; for a static layout preview, `python -m http.server` works but not live API routes.

## Negotiation Timeline (v1.1)

Historical curated milestones in `timeline.js` have explicit event dates, source links and careful descriptions of the limits of each agreement. The user can select the conflict and compare two dates or choose 7 days, 30 days, one year or the entire archive. The historical cards remain distinctly separated from *unverified recent news headlines*. The counters summarize only curated historical milestones. No implied claim of complete historical coverage or direct peace forecast.

## Watch Bell and Strike Reports (v1.1)

`alerts.js` gives a 72-hour in-app alert feed focused on reported strikes and diplomatic developments. Categories are conservative headline regex matches, not verified incidents. Initial load creates a baseline (no notification storm); newly observed headlines on later fetches are unread and persist on the browser. Per-category toggles, read/unread state and 5-minute refresh when the page is visible. Browser notifications are **opt-in through the Permissions API and work only while the website remains open**; background push after the page is closed is **not implemented** and would require a push subscription service, service worker and server-side event processing. Personal settings are stored locally, not sent to a server.

## Evolution

Suggested next steps: persistent server-side timeseries, corroboration grouping for independent publisher chains, ACLED-authenticated event integration, manually curated treaty milestones, an explainable calibrated event model evaluated with historical ground truth and expert review.


## PAX 2.0 — Evidence Monitor (November 2026)

The original numerical 0–100 Peace Proximity Index was retired. It was an uncalibrated ratio of keyword-tagged headlines and should not be interpreted as a peace probability. The new Evidence Monitor has qualitative headline-coverage states: diplomatic coverage, escalation coverage, mixed coverage, or insufficient reporting. Grouping similar titles reduces but does not eliminate duplicate news signals. No state constitutes a verified political or military event.

**Sources:** A server-side API merges Google News broad + newswire-constrained queries, BBC World RSS, The Guardian World RSS, Al Jazeera RSS, DW RSS and GDELT DOC. It reports each feed's HTTP availability, raw item counts and the publishers of the filtered articles. News discovery services might return duplicates, irrelevant reports, unreliable metadata or stale items. The exact selection fluctuates with public API availability. A source may be accessible yet yield zero relevant items.

**Source Intelligence:** `intelligence.js` builds editorial clusters of similar headlines (Jaccard token similarity and time window), shows multiple publisher links per cluster and distinguishes source diversity from independent verification. A manually authored diplomatic *question list* is for inquiry, **not** attributed positions of any side. This is not an automated truth checker.

**Conflict Economics:** `/api/markets` downloads public historical observations from Federal Reserve Bank of St. Louis FRED for Brent, WTI, Henry Hub natural gas, EUR/USD and global wheat (subject to availability). Latest source date is shown, together with recent within-series change and sparklines. Prices are *not* automatically attributed to any conflict and are not necessarily real-time. Provider failures show unavailable instead of fabricated figures.

**Push status:** Background push when the browser is closed is not available: it needs a protected push-subscription service, web push credentials, a service worker, and controls against spoofed or low-confidence alerts. The current browser notifications are opt-in and page-open only.

Future work: editorial event verification with primary documents and source-of-source attribution, persistent versioned evidence timelines, calibrated quantitative research with backtests, user-managed notification subscriptions, and robust historical conflict-linked market event studies.

**Market-provider availability (Nov 2026):** Unauthenticated FRED CSV fetches can be rejected by FRED. The API therefore accepts optional `FRED_API_KEY` configured **only** in Vercel environment settings, never committed to GitHub; an ECB public XML fallback is used for EUR/USD. Unavailable commodities remain blank rather than inferred or made up.

**Release note:** Code changes must be deployed by the connected Vercel project. A GitHub commit does not imply that production updated successfully; always verify active deployment SHA and website before announcing a release.

## PAX 2.1 — Greek/English and post-onset historical negotiations

Use the EN / ΕΛ toggle in the header. UI translations are implemented in `i18n.js` and saved locally. International news headlines retain their original language. Dated, curated diplomacy records offer English translation and a primary-source or directly linked news source; `history.js` contains additions and conflict-scope definitions.

The **live feed** is a rolling 7-day source aggregation that **cannot display reports dated before the start of the monitored conflict phase**. The **Negotiation Timeline** is a selective, linked historical archive of agreements, calls for ceasefire, implementation, breakdowns and talks dating from the conflict-phase start, with a distinct opt-in control for older contextual history. Sources are not automatically validated for ongoing implementation.

Conflict phase start dates (not claims that the entire dispute began then):
- Ukraine 2022-02-24 (full-scale invasion; wider war 2014)
- Gaza 2023-10-07 (current war)
- Israel–Iran 2024-04-13 (direct confrontation)
- US–Iran 2025-06-22 (direct military phase)
- Sudan 2023-04-15 (SAF–RSF war)
- DR Congo / M23 2022-03-28 (renewed M23 phase)
- Myanmar 2021-02-01 (post-coup period)
- Yemen 2015-03-26 (regional intervention, preceded by internal crisis)
- Syria 2011-03-15 (2011 uprising and ensuing conflict)

### Render fallback (no dependencies)

The app can be deployed to Render as a **Node web service** from repository `https://github.com/mariodinakus/world-faultline`, branch `main`, start command `node pax/server.js`, and build command `echo PAX ready`. The server serves assets from `pax/` and routes `/api/news` and `/api/markets` through the same Vercel-compatible handlers. Use the free tier only if suitable for usage and delay requirements. Configure optional FRED_API_KEY in Render environment, never in committed files. A Render workspace must be explicitly selected before provisioning. Creating a Render service does **not** migrate or alter the existing Vercel domain.


## Performance and static-first production (11 Nov 2026)

The primary user-facing Render URL is `https://pax-intelligence-fast.onrender.com` (static CDN, `pax/` publish directory). This renders the interface without waiting for the free Node service to wake. It uses `https://pax-conflict-intelligence.onrender.com` for read-only `/api/news` and `/api/markets` endpoints and checks `/health` before loading the first batch of reports. The former Node-only UI URL remains functional for comparison and diagnostics, but free instances can sleep; do not confuse UI availability with feed availability.

News processing now uses 3-client-request concurrency, prioritizes the currently selected region, progressively renders available coverage, shares cached publisher RSS across all conflict dossiers, limits upstream concurrency, uses short source timeouts, and invokes GDELT only for sparse results. Initial or subsequent refreshes may be delayed by upstream publisher availability. Observed source errors are not treated as proof that no event occurred.

All production services are intended to track GitHub main. Verify each new commit's actual Render deployment; in the 11 Nov 2026 deployment inspection, the original Node service did not automatically redeploy despite its `autoDeploy=yes` flag, so an explicit deployment was required. Do not assume its webhook is reliable without checking.

## PAX 2.2 — lightweight evidence-first features

Four new UI capabilities added in `pax/index.html`, `desk.css` and small dependency-free scripts:

1. **What Changed / Daily Brief** (`briefing.js`): configurable 24h and 72h windows; global or conflict-specific source-linked headlines; category counts reflect **similar-headline clusters**, not verified events. The previous equally sized period is a reporting-volume baseline, not a battlefield or diplomatic trend. Reporting appears incrementally as regions finish loading.
2. **Peace Process Tracker** (`peace-process.js`): four descriptive stages (talks/proposals, agreements, reported implementation, setbacks), selectable dossier, sourced milestones, search, show-more. The latest source-linked historical entry is NOT asserted to be the current ceasefire or negotiation status. The broader timeline remains separately available.
3. **Smart Watch Desk** (`alerts.js`): configurable strike, negotiation/proposal and agreement/implementation/breakdown reporting. Region filters, normalized same-headline/date dedup, and prioritized browser alerts while the site is open; no persistent remote push, automatic event confirmation or attack-location tracking. Watch storage is versioned to avoid marking old initial reports as newly discovered in the updated classification.
4. **Game Theory Lab** (`game-theory.js`): expandable on demand; transparent 2x2 hypothetical utilities for talks versus hardline strategies. Includes individual sliders, both actors' payoff matrix and exhaustive pure-strategy Nash checks. Utility units are illustrative and **never estimates of any actual government's preferences, forecast, or peace probability**.

Performance: `pax-intelligence-fast.onrender.com` is still the preferred static Render homepage; `pax-conflict-intelligence.onrender.com` is the JSON API service. No new server-side news calls, chart frameworks or heavyweight modeling libraries were introduced for 2.2. English and Greek are maintained in `i18n.js` and the new scripts.

Validation notes: all JavaScript syntax checks passed; new section controls, unique HTML IDs and matched structural tags checked; logical Nash equilibrium test passed for default and modified assumptions; all nine region phase start-date constraints checked. These checks do not substitute for a live browser end-to-end test or independent verification of all curated historical source URLs.

Map performance optimization: D3, TopoJSON and country geometry are now loaded only when the map panel approaches the viewport (IntersectionObserver); the first paint does not request the large world-map libraries. The region list remains accessible if an external map CDN is unavailable.


## PAX 2.3 — Negotiation Room / Time Machine / Narrative Divergence

The static-first site adds three sections and requires **no new backend dependency, credentials, or external calls** beyond its existing news API:

- **Negotiation Room** (`negotiation-room.js` + `negotiation.css`): a curated issue taxonomy for nine monitored conflict phases (27 research issues total), searchable via the global conflict selector. Positions tab displays **only dated, attributed historic statements or commitments** with source URLs when present; absence is reported rather than filled with fictional current positions. Obstacles tab asks open research questions, not verified impasses. Compromises lists conditional **hypothetical** monitoring and sequencing mechanisms, not agreed proposals. Next Move gives conditional branches and opens the existing Nash payoff lab. Attribution is not validation of the speaker's factual claim or of present circumstances.
- **Time Machine** (`time-machine.js`): a region-aware historical **event-date replay** from the conflict-phase onset to present, date picker/slider/presets, milestone counts before and after the chosen date and dated source links. **Not a true point-in-time information archive.** Some sources documenting an earlier event were themselves published later, so it must not be used for historical backtesting of contemporaneous knowledge.
- **Narrative Divergence** (`narrative.js`): lazy-on-scroll comparison of titles. The strict mode requires similarity clustering and >=2 named publishers; the optional coverage sample shows distinct publishers covering the same conflict, **not necessarily the same event**. Headline keyword tags describe only wording. No whole-article reading, automated truth adjudication, media bias scoring or factual contradiction detection.

The `PAX_ROOM_POSITIONS` structured ledger deliberately contains only a limited number of sourced historical actor positions: among them June 2024 Ukrainian and Russian territorial/security statements, September 2025 Israeli government conditions, May 2023 SAF/RSF Jeddah commitments, the 2022 Yemen truce and March 2025 Syrian authorities/SDF integration agreement. These are **dated archival records**, not statements of any actor's current November 2026 policy. Keep each claim's publication date, attribution and original link when updating.

Internationalization: the Greek/English switch covers the new static UI and all three components' dynamic copy. The new tools consume existing in-memory source-linked data without new remote requests, and Narrative Divergence uses IntersectionObserver to defer processing until visible. The PAX Fast static UI remains preferred at `https://pax-intelligence-fast.onrender.com/`; the Render API stays separate. Changes are scoped to `pax/` in `mariodinakus/world-faultline` and do not change its root app, the Vercel project or DNS.

## PAX 3 — Four views, real-data game theory (November 2026)

**Structure.** The single long page is split into four hash-routed views (`views.js`): *Σήμερα* (`#/today`), *Συγκρούσεις* (`#/conflict/<id>/<tab>` with tabs Σήμα · Χρονολόγιο · Διαδικασία · Διαπραγμάτευση · Χρονομηχανή · Παίγνιο · Ανθρωπιστικά), *Ροή & Πηγές* (`#/feed/<id>`) and *Μέθοδος & δεδομένα* (`#/tools`). One sticky conflict selector replaces the five per-section dropdowns.

**Daily data pipeline.** `.github/workflows/pax-data.yml` runs `pax/scripts/collect.mjs` once a day and commits JSON to the `pax-data` branch (served from raw.githubusercontent.com; Vercel builds are disabled on that branch):
- `gdelt.json` — GDELT 2.0 Event exports aggregated per conflict dyad, per direction and day: event counts, mention-weighted Goldstein, cooperative (QuadClass 1–2) vs conflictual (3–4) events. Sudan and Myanmar are excluded because GDELT rarely assigns a country to rebel/paramilitary actors, so sides cannot be separated.
- `headlines.json` — a daily snapshot of PAX's own headline classification, building a real history instead of browser-only localStorage.
- `ucdp.json` — UCDP GED candidate fatalities per month, only when the `UCDP_TOKEN` repository secret is set.
Run it manually from GitHub → Actions → *PAX daily data* → *Run workflow* (default backfill 90 days).

**Observed game (Παίγνιο tab).** For each dyad: 7-day rolling share of conflictual events in each direction; an empirical 2×2 where a side "escalates" on days above its own median conflict share; and a reciprocity regression `A_t = α + β·B_{t−1} + γ·A_{t−1}` (OLS, |t| ≥ 2 reported as a pattern). This measures temporal association in press-coded events, not causation or intent. The hypothetical Nash lab stays below it, clearly labelled as assumptions.

**New sources.** `/api/greek` (Google News Greece, Greek-language headlines per conflict, shown next to the international feed) and `/api/relief` (ReliefWeb/UN OCHA reports; needs an approved appname in the `RELIEFWEB_APPNAME` Vercel environment variable).

## PAX Peace Signals and relevance fixes (12 November 2026)

The conflict **Signal** tab now includes a three-axis *Peace Signals* panel:
diplomacy/proposals, reported agreements/implementation, and escalation/obstacles.
All counts are source-linked seven-day **clusters of published headlines**, not
verified events, treaty compliance, or peace probabilities. The newest curated,
dated milestone is shown separately and labelled as archival; the process and
empirical-game views remain one click away.

The shared-news filter now requires both named sides for Iran–Israel and U.S.–Iran
dossiers; Gaza coverage needs a Gaza/Palestine-specific reference. The alert
centre also de-duplicates the same publisher headline across dossiers and
relabels prior Gaza reports incorrectly shown as Iran–Israel alerts. Existing
browser consent and page-open-only notification limits are unchanged.

This does **not** provide a continuously independently verified agreement
implementation ledger, nor cross-conflict matched historical peace probabilities.
Those require a separately curated, dated evidence base and verification process.
