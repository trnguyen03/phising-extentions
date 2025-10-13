"""Feature engineering pipeline for phishing URL detection."""
from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

import pandas as pd

SUSPICIOUS_KEYWORDS = {
    "login",
    "verify",
    "update",
    "password",
    "secure",
    "account",
    "confirm",
}


@dataclass
class UrlFeatures:
    url: str
    label: int
    url_length: int
    digit_count: int
    suspicious_keyword: int
    has_at_symbol: int
    has_hyphen: int
    subdomain_count: int
    uses_https: int


def tokenize_url(url: str) -> str:
    return url.replace("https://", "").replace("http://", "")


def compute_features(url: str) -> dict[str, int]:
    processed = tokenize_url(url)
    hostname = processed.split("/")[0]
    parts = [part for part in hostname.split(".") if part]
    subdomain_count = max(len(parts) - 2, 0)
    digit_count = sum(char.isdigit() for char in processed)
    suspicious_keyword = int(any(keyword in processed.lower() for keyword in SUSPICIOUS_KEYWORDS))
    has_at_symbol = int("@" in processed)
    has_hyphen = int("-" in hostname)
    uses_https = int(url.lower().startswith("https"))
    return {
        "url_length": len(processed),
        "digit_count": digit_count,
        "suspicious_keyword": suspicious_keyword,
        "has_at_symbol": has_at_symbol,
        "has_hyphen": has_hyphen,
        "subdomain_count": subdomain_count,
        "uses_https": uses_https,
    }


def transform_dataset(rows: Iterable[dict[str, str]]) -> pd.DataFrame:
    records: list[UrlFeatures] = []
    label_map = {"legitimate": 0, "phishing": 1}
    for row in rows:
        url = row["url"]
        label = label_map[row["label"].strip().lower()]
        features = compute_features(url)
        records.append(
            UrlFeatures(
                url=url,
                label=label,
                **features,
            )
        )
    return pd.DataFrame(asdict(record) for record in records)


def main() -> None:
    input_path = Path("ml/data/sample_urls.csv")
    output_path = Path("ml/data/engineered_features.csv")
    df_raw = pd.read_csv(input_path)
    df_transformed = transform_dataset(df_raw.to_dict("records"))
    df_transformed.to_csv(output_path, index=False)
    print(f"Wrote engineered features to {output_path}")


if __name__ == "__main__":
    main()
