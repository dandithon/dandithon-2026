"""Reproducible synthetic Seomun demo; no observations from a real kitchen."""
import hashlib
import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import GroupShuffleSplit

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'ml' / 'artifacts'
RESOURCE = ROOT / 'src/main/resources/eta'
FEATURES = ['tteok', 'sundae', 'fried', 'fish']
# Minutes per batch and servings per batch: explicit demo assumptions, NOT measurements.
BATCH_MINUTES = np.array([2.0, 2.5, 4.0, 1.0])
BATCH_CAPACITY = np.array([4, 3, 2, 5])


def generate():
    rng = np.random.default_rng(42)
    catalog = json.loads((ROOT / 'src/main/resources/market-catalog.json').read_text())
    assert {m['id'] for s in catalog if s['id'] == 'seomun' for m in s['menus']} == set(FEATURES)
    rows = []
    # Separate simulated days permit held-out-day evaluation; no real customer data.
    for day in range(100):
        now = ready = 0.0
        day_speed = rng.uniform(0.85, 1.15)
        for sequence in range(50):
            now += rng.exponential(6 if day % 2 else 2)
            quantities = np.zeros(4, dtype=int)
            chosen = rng.choice(4, size=int(rng.integers(1, 5)), replace=False)
            for i in chosen:
                quantities[i] = rng.integers(1, 6) if rng.random() < 0.88 else rng.integers(6, 100)
            # Each menu batch can run in parallel; orders are handled FIFO, one ticket at a time.
            batches = np.ceil(quantities / BATCH_CAPACITY)
            prep = max(0.5, float(np.max(batches * BATCH_MINUTES)) * day_speed + rng.normal(0, 0.25))
            queue = max(0, ready - now)
            ready = now + queue + prep
            rows.append(dict(day=day, sequence=sequence, arrival_minutes=now,
                             **dict(zip(FEATURES, quantities.tolist())),
                             queue_minutes=queue, prep_minutes=prep, eta_minutes=queue + prep))
    return pd.DataFrame(rows)


def export_tree(tree):
    t = tree.tree_
    return dict(left=t.children_left.tolist(), right=t.children_right.tolist(),
                feature=t.feature.tolist(), threshold=t.threshold.tolist(),
                value=t.value[:, 0, 0].tolist())


def predict_export(artifact, values):
    x = np.asarray(values, dtype=np.float32)
    total = 0.0
    for t in artifact['trees']:
        node = 0
        while t['left'][node] != -1:
            node = t['left'][node] if x[t['feature'][node]] <= t['threshold'][node] else t['right'][node]
        total += t['value'][node]
    return total / len(artifact['trees'])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RESOURCE.mkdir(parents=True, exist_ok=True)
    df = generate()
    dataset = df.to_csv(index=False, float_format='%.9f')
    data_dir = ROOT / 'ml/datasets'
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / 'seomun-synthetic.csv').write_text(dataset)
    train, test = next(GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42).split(df, groups=df.day))
    assert set(df.iloc[train].day).isdisjoint(df.iloc[test].day)
    X = df[FEATURES]
    y = df.prep_minutes
    model = RandomForestRegressor(n_estimators=64, max_depth=12, min_samples_leaf=2,
                                  random_state=42, n_jobs=1)
    model.fit(X.iloc[train], y.iloc[train])
    predicted = model.predict(X.iloc[test])
    baseline = np.full(len(test), y.iloc[train].mean())
    metrics = dict(training_rows=len(train), test_rows=len(test), training_days=80, test_days=20,
                   prep_mae_minutes=float(mean_absolute_error(y.iloc[test], predicted)),
                   baseline_mean_prep_mae_minutes=float(mean_absolute_error(y.iloc[test], baseline)),
                   prep_r2=float(r2_score(y.iloc[test], predicted)),
                   total_eta_mae_minutes=float(mean_absolute_error(df.iloc[test].eta_minutes,
                                                                   df.iloc[test].queue_minutes + predicted)))
    artifact = dict(schemaVersion=1, modelVersion='seomun-rf-synthetic-v1',
                    dataSource='SYNTHETIC', features=FEATURES, minimumQuantity=0, maximumQuantity=99,
                    datasetSha256=hashlib.sha256(dataset.encode()).hexdigest(),
                    trees=[export_tree(t) for t in model.estimators_])
    # Check the exact same inference format Java serves against sklearn on every held-out sample.
    exported = np.array([predict_export(artifact, row) for row in X.iloc[test].to_numpy()])
    assert np.max(np.abs(predicted - exported)) < 1e-9
    (RESOURCE / 'seomun-model.json').write_text(json.dumps(artifact, separators=(',', ':')) + '\n')
    vectors = [dict(quantities=dict(zip(FEATURES, row.tolist())), expectedMinutes=float(value))
               for row, value in zip(X.iloc[test].to_numpy()[:24], predicted[:24])]
    (RESOURCE / 'parity-vectors.json').write_text(json.dumps(vectors, indent=2) + '\n')
    metrics.update(data_source='SYNTHETIC', evaluation='held-out simulated days; not real-store accuracy',
                   dataset_sha256=artifact['datasetSha256'], sklearn_version=sklearn.__version__,
                   export_max_absolute_difference=float(np.max(np.abs(predicted - exported))))
    (ROOT / 'ml/metrics.json').write_text(json.dumps(metrics, indent=2) + '\n')
    joblib.dump(dict(model=model, features=FEATURES), OUT / 'market_eta_model.pkl')
    print(json.dumps(metrics, indent=2))


if __name__ == '__main__':
    main()
