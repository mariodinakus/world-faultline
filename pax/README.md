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

## Evolution

Suggested next steps: persistent server-side timeseries, corroboration grouping for independent publisher chains, ACLED-authenticated event integration, manually curated treaty milestones, an explainable calibrated event model evaluated with historical ground truth and expert review.
