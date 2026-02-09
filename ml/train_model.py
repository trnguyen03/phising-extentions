"""Train a logistic regression model for phishing URL detection."""
from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

FEATURE_COLUMNS = [
    "url_length",
    "digit_count",
    "suspicious_keyword",
    "has_at_symbol",
    "has_hyphen",
    "subdomain_count",
    "uses_https",
]


def main() -> None:
    features_path = Path("ml/data/engineered_features.csv")
    if not features_path.exists():
        raise SystemExit(
            "Missing engineered features. Run `python ml/feature_engineering.py` first."
        )

    df = pd.read_csv(features_path)
    X = df[FEATURE_COLUMNS]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    model = LogisticRegression(max_iter=500)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True)

    model_path = Path("ml/model/phishguard-logistic.pkl")
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)

    report_path = Path("ml/model/training_report.json")
    pd.DataFrame(report).to_json(report_path, orient="index", indent=2)

    print(f"Saved model to {model_path}")
    print(f"Saved evaluation report to {report_path}")


if __name__ == "__main__":
    main()
