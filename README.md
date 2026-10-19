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
