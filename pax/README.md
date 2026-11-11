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
