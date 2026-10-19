"""Transparent directed exposure-network *scenario* calculator.

Input edges CSV columns: source,target,weight. Weight must be a finite, non-negative,
externally justified exposure measure. A shock in source is transmitted to target:
  s_{t+1}[target] = initial[target] + decay * sum_source(W[target,source] s_t[source])

Never represent output as an estimated real-world transmission probability.
"""
from __future__ import annotations
import argparse
import json
import numpy as np
import pandas as pd


def propagate(edges: pd.DataFrame, source: str, magnitude: float,
              decay: float = 0.35, steps: int = 8) -> pd.DataFrame:
    expected = {'source', 'target', 'weight'}
    if not expected.issubset(edges):
        raise ValueError(f'Expected columns {sorted(expected)}')
    if not (0 <= decay < 1) or not np.isfinite(magnitude) or magnitude < 0:
        raise ValueError('Use 0 <= decay < 1 and finite, non-negative magnitude')
    if steps < 1 or steps > 500:
        raise ValueError('Use 1 to 500 propagation steps')
    data = edges.copy()
    data['weight'] = pd.to_numeric(data['weight'], errors='raise')
    if not np.isfinite(data['weight']).all() or (data['weight'] < 0).any():
        raise ValueError('Exposure weights must be finite and non-negative')
    nodes = sorted(set(data['source']).union(data['target']).union({source}))
    pos = {n: i for i, n in enumerate(nodes)}
    matrix = np.zeros((len(nodes), len(nodes)), dtype=float)
    for edge in data.itertuples(index=False):
        matrix[pos[edge.target], pos[edge.source]] += float(edge.weight)
    # Normalize by origin exposure and reveal the normalization assumption.
    outgoing = matrix.sum(axis=0)
    nonzero = outgoing > 0
    matrix[:, nonzero] = matrix[:, nonzero] / outgoing[nonzero]
    seed = np.zeros(len(nodes)); seed[pos[source]] = magnitude
    path = seed.copy()
    records = [{'country': n, 'step': 0, 'scenario_stress': float(v)} for n, v in zip(nodes, path)]
    for step in range(1, steps + 1):
        path = seed + decay * matrix @ path
        records.extend({'country': n, 'step': step, 'scenario_stress': float(v)}
                       for n, v in zip(nodes, path))
    return pd.DataFrame(records)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--exposures', required=True, help='Observed directed exposure CSV: source,target,weight')
    p.add_argument('--source', required=True)
    p.add_argument('--magnitude', type=float, default=5)
    p.add_argument('--decay', type=float, default=.35)
    p.add_argument('--steps', type=int, default=8)
    p.add_argument('--output', default='scenario_paths.csv')
    args = p.parse_args()
    result = propagate(pd.read_csv(args.exposures), args.source, args.magnitude,
                       args.decay, args.steps)
    result.to_csv(args.output, index=False)
    print(json.dumps({'status': 'scenario_only', 'output': args.output,
                      'node_count': int(result.country.nunique()),
                      'steps': args.steps,
                      'assumptions': ['Nonnegative normalized directed exposures',
                                      'Fixed propagation multiplier',
                                      'No calibration, no predicted probabilities']}, indent=2))


if __name__ == '__main__':
    main()
