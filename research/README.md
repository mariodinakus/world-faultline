# Research Core · Standalone Python

The **browser** delivers World Bank indicators and purely illustrative scenario controls. This directory contains two separate runnable research tools — neither is trained on invented data.

Install: `pip install -r requirements.txt` in `research/`.

## Expanding-window early warning

Provide a cleaned, **point-in-time country-year** CSV with `country`, `year`, a binary future event label, and numeric predictors. For instance:

```text
country,year,banking_crisis_next_year,gdp_growth,inflation,private_credit_gdp
```

Run:

```bash
python early_warning.py --input panel.csv --features gdp_growth inflation private_credit_gdp --label banking_crisis_next_year --horizon 1 --holdout-start 2012 --output predictions.csv
```

The model uses nested chronology at prediction origin o: historical training examples at t require `t + horizon < o`, so their outcome window has closed. Imputation/scaling are learned within each training fold. Every out-of-time prediction is saved alongside Brier, log loss, PR-AUC and ROC-AUC where defined. Country-year outcomes need **crisis wave** sensitivity analyses; these observations are not independent crises. Beware contemporaneous dataset revisions and publication lags.

## Directed network stress

Prepare user-supplied observed links:

```text
source,target,weight
USA,DEU,2.5
DEU,GRC,1.0
USA,GRC,0.8
```

Run:

```bash
python network_stress.py --exposures links.csv --source USA --magnitude 5 --decay 0.35 --steps 8 --output scenario_paths.csv
```

The code normalizes each origin column by total outgoing weights, propagates a nonnegative hypothetical stress magnitude and records **scenario paths**. Do not interpret numbers as observed losses, actual bilateral risk or fitted contagion. To infer economic losses, map shocks onto domain-specific exposure units and validate estimated coefficients with historical observations.

**Next academic milestones:** define banking/sovereign/FX crisis labels, harmonize vintages, use calendar/episode independent folds, quantify the event-count problem, stress-test EVTs and network sensitivity, and publish model cards.
