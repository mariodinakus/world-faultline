# WORLD FAULTLINE · Global Systems Observatory

An open-data country intelligence research application (static site, no build pipeline) designed for deployment to Vercel.

## Features
- Live country directory and annual series from the **World Bank Indicators API v2**, including WDI, Enterprise Survey/WDI and WGI governance indicators.
- 7 macroeconomic, microeconomic, financial, structural, social and institutional data pillars (~50 indicators).
- Interactive world map (ECharts, with graceful fallback), country profiles, charts, data tables and CSV exports.
- Cross-country research comparison with documented observation years.
- Scenario-only laboratory, **not** a fitted crisis-forecasting or empirically estimated contagion model.
- Academic research methods and data provenance notes.

## Run
Serve the folder with any static web server:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy to Vercel
Create a Vercel project and import this folder as a static site. Framework preset: **Other**; output directory: root (`.`); no build command.

## Data and security
- Public live endpoint: `https://api.worldbank.org/v2/`. No private user data or API keys are requested.
- The site loads ECharts and world GeoJSON from third-party content delivery networks; if unavailable, tables and country searches remain useful.
- Public API availability, caching, country definitions and client network connectivity affect data freshness.
- Do not present the scenario engine as crisis prediction. Add training labels, vintage-aware evaluation and verified directed BIS/UN Comtrade networks before presenting fitted contagion results.
- Social feeds, finance proprietary vendors, granular firm microdata and platform-restricted data are **not connected** in this initial version.

## Intended research extensions
IMF WEO/IFS/FAS, BIS LBS/CBS, Comtrade trade matrices, GDELT, V-Dem, UCDP, event-history databases; panel feature store; nested rolling backtests; extreme value tests; model cards and revision tracking.

## License and attribution
Open-source MVP code (MIT); the World Bank and data providers retain their dataset terms. Consult each original source for permitted redistribution and attribution.

## Research Python modules

The included [`research/`](research/) directory contains a separate expanding-window logistic early-warning baseline, using supplied country-year crisis labels, plus a directed-exposure network stress simulator. Both are runnable with external validated datasets; no fitted crisis or propagation results are included in the site until they have been trained and assessed. See [`research/README.md`](research/README.md).

## Initial version limitations

The app displays sourced annual economic/enterprise/governance indicators, not all requested data domains. Religion, press-freedom, platform-specific Facebook/Instagram/TikTok/X signals, bilateral international trade and banking exposures, event labels and published forecasts require further licensed source connectors and validation. The geographic layer requires the third-party world map GeoJSON host. No data are fabricated to cover gaps.


## Macroeconomic Stress Index (MSI) — experimental global screen (v0.2)

The dashboard loads the World Bank country/economy directory and eight World Development Indicators from the World Bank Indicators API v2, then computes a **descriptive macroeconomic pressure index** on a 0–100 scale across economies with enough data. The global grid includes ALL directory economies, even if an economy cannot be scored (N/A). Country profiles still expose the existing broader 7-pillar catalogue, now expanded to include reserves in months of imports. An all-country CSV export includes transparent coverage metadata.

**Not a probability or validated predictor:** The composite is weighted, with deliberately provisional breakpoints rather than estimates fitted on labeled crises. It is unsuitable for asserting that a particular crisis will occur or assigning probabilities. The underlying transformations are in `risk.js`. Fixed weights: GDP growth 18%, inflation 18%, unemployment 12%, current account/GDP 12%, government debt/GDP 14%, bank NPL 12%, reserves in months of imports 8%, external debt service/exports 6%. Missing values are not imputed. Observations more than four years old are discarded, and an economy is not scored with fewer than four usable indicators or below 55% of weighted coverage. Available weights are renormalized per economy, so low-coverage readings are not strictly comparable.

**Data caveats:** Some variables (NPLs, government debt, debt service) have highly uneven global coverage. Financial structure, reserve adequacy, exchange regimes, outlier historical years, measurement changes, and different release years affect cross-country comparability. Monetary union members cannot be interpreted with reserve thresholds in the same way as independent-currency economies. WGI/perception or political characteristics are **not** used to compute the index; those remain individually inspectable original indicators. No social-media data, conflict dataset, bilateral exposure model or black-swan forecasting is implied. A future publishable model requires versioned crisis labels, point-in-time data, meaningful predictive baselines, temporal out-of-sample tests, calibration and uncertainty estimates.

**Global fetch:** The app requests two batches of four World Bank indicator series across all recognized economies (`source=2`, `mrnev=1`). Failed source batches are disclosed and can produce N/A rather than invented figures. Maps and CSV export are populated only after source responses return.


## Systemic Vulnerability Index (SVI), v0.3

The website retains its source-backed economy-level data and includes a new descriptive 3-domain experimental composite; it is **not** a calibrated crisis probability, nor an assessment of any political actor or voting choice. Missing values are never fabricated or imputed. The global panel and downloaded CSV retain N/A for unscored economies.

### Equations

    D[i,t] = sum(w[j] * g[j](x[i,j,t])) / sum(w[j] for fresh source observations)
    SVI[i,t] = 0.50 * Economic[i,t] + 0.25 * Social[i,t] + 0.25 * Institutional[i,t]

All individual source variables are converted to 0–100 bounded pressure using transparently stated but **unfitted** thresholds, directions and weights in risk.js.

Economic domain (8 variables): GDP growth, inflation, unemployment, current-account balance, government debt/GDP, bank nonperforming loans, reserves in months of imports, external debt service/exports. Social domain (5): youth unemployment, Gini inequality, poverty headcount below $3/day in 2021 PPP, vulnerable employment, under-five mortality. Institutional domain (6): World Bank Worldwide Governance Indicators 0–100 scores for rule of law, control of corruption, government effectiveness, political stability, regulatory quality and voice/accountability. WGI are perception-based and inherently uncertain; they are not ratings of government officials or political parties.

Data older than 4 (economic), 7 (social) or 3 (institutional) years are considered stale. Domain minimums: economic at least 4 variables and 55% weight coverage, social at least 2 and 50%, institutional at least 3 and 50%. SVI is withheld unless all domains qualify; present indicators are renormalized by sum of their available weights. Uneven coverage limits cross-country comparability. Country details show original values, years, gaps, weights, provider source links and transformed 0–100 scores.

The accounting identity Y=C+I+G+(X-M) is not a derivation of composite weights, and the given weights are research assumptions. An actual crisis probability would require a labeled crisis dataset, proper vintage-aware estimation, train/test partitions blocked by global crisis clusters, recursive backtests, uncertainty quantification and calibration. Social conditions are not direct short-term crisis predictions. Genuine unexpected black-swan onset timing cannot be inferred.

Data are requested from the World Bank Indicators API when users load the site; this version does not include proprietary social media streams, live financial exposures, or independently verified model forecasts.
