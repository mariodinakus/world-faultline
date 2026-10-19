"""Expanding-window, out-of-time logistic crisis research baseline.

Research template only. This script cannot predict a crisis unless a user supplies
historically labelled country-year panel data with *point-in-time* features.

Example:
python early_warning.py --input observations.csv --features credit_gdp gdp_growth inflation --label banking_crisis_next_year --horizon 1 --holdout-start 2012 --output predictions.csv
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, log_loss, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


def evaluate(panel: pd.DataFrame, features: list[str], label: str, horizon: int,
             holdout_start: int, min_training_years: int = 8) -> tuple[pd.DataFrame, dict]:
    needed = {'country', 'year', label, *features}
    absent = needed.difference(panel.columns)
    if absent:
        raise ValueError(f'Missing columns: {sorted(absent)}')
    if horizon < 1:
        raise ValueError('horizon must be >= 1 calendar year')
    df = panel.copy()
    if df.duplicated(['country', 'year']).any():
        raise ValueError('Duplicate country-year rows would corrupt the test design')
    df['year'] = pd.to_numeric(df['year'], errors='raise').astype(int)
    for f in features:
        df[f] = pd.to_numeric(df[f], errors='coerce')
    df[label] = pd.to_numeric(df[label], errors='coerce')
    valid = df[label].dropna()
    if not valid.isin([0, 1]).all():
        raise ValueError('Crisis labels must be 0/1 or missing')
    predictions = []
    origins = sorted(y for y in df.year.unique() if y >= holdout_start)
    first_year = int(df.year.min())
    fold_log = []
    for origin in origins:
        # A label defined at t for a crisis in [t, t+h] is not observable
        # at an origin o until its entire window is over (t+h < o).
        train = df[(df.year + horizon < origin) & df[label].notna()]
        test = df[(df.year == origin) & df[label].notna()]
        if train.year.nunique() < min_training_years or train[label].nunique() < 2 or test.empty:
            fold_log.append({'origin': int(origin), 'status': 'skipped_insufficient_train_or_test'})
            continue
        model = make_pipeline(
            SimpleImputer(strategy='median', keep_empty_features=True),
            StandardScaler(),
            LogisticRegression(max_iter=3000, C=1.0, solver='lbfgs'),
        )
        model.fit(train[features], train[label].astype(int))
        probabilities = model.predict_proba(test[features])[:, 1]
        batch = test[['country', 'year', label]].copy()
        batch['predicted_probability'] = probabilities
        batch['training_last_origin'] = int(train.year.max())
        batch['feature_horizon_years'] = horizon
        predictions.append(batch)
        fold_log.append({'origin': int(origin), 'status': 'evaluated',
                         'training_rows': int(len(train)), 'test_rows': int(len(test)),
                         'training_events': int(train[label].sum()),
                         'test_events': int(test[label].sum())})
    if not predictions:
        raise ValueError('No valid rolling-origin folds: check crisis labels, panel years and holdout start')
    result = pd.concat(predictions, ignore_index=True)
    y = result[label].astype(int).to_numpy()
    p = result.predicted_probability.to_numpy()
    stats = {
        'method': 'expanding_window_logit',
        'rows_out_of_time': int(len(result)), 'positive_observations': int(y.sum()),
        'positive_rate': round(float(y.mean()), 6),
        'brier': round(float(brier_score_loss(y, p)), 6),
        'log_loss': round(float(log_loss(y, p, labels=[0, 1])), 6),
        'average_precision': round(float(average_precision_score(y, p)), 6) if y.sum() else None,
        'roc_auc': round(float(roc_auc_score(y, p)), 6) if len(set(y)) > 1 else None,
        'folds': fold_log,
        'cautions': [
            'Country-year observations are not independent crisis events or crisis waves.',
            'Feature release dates/revisions MUST be verified; year-only alignment does not prevent vintage leakage.',
            'Predictive performance is not established by testing on synthetic or tiny data.',
            'Calibrate probabilities in a nested strictly temporal scheme before production claims.',
        ],
    }
    return result, stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--output', default='predictions.csv')
    ap.add_argument('--features', nargs='+', required=True)
    ap.add_argument('--label', required=True)
    ap.add_argument('--horizon', type=int, default=1)
    ap.add_argument('--holdout-start', type=int, required=True)
    ap.add_argument('--min-training-years', type=int, default=8)
    args = ap.parse_args()
    predictions, report = evaluate(pd.read_csv(args.input), args.features, args.label,
                                   args.horizon, args.holdout_start, args.min_training_years)
    predictions.to_csv(args.output, index=False)
    report_path = str(Path(args.output).with_suffix('.metrics.json'))
    Path(report_path).write_text(json.dumps(report, indent=2))
    print(json.dumps({k: v for k, v in report.items() if k != 'folds'}, indent=2))
    print(f'Saved {args.output} and {report_path}')


if __name__ == '__main__':
    main()
