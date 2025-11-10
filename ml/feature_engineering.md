# Feature Engineering Pipeline

Tệp này mô tả quy trình tạo đặc trưng từ dữ liệu URL để phục vụ huấn luyện mô hình phát hiện phishing.

## Bước 1 – Thu thập dữ liệu

- Nguồn dữ liệu tham khảo: [PhishTank](https://phishtank.org/), [OpenPhish](https://openphish.com/), các bộ dữ liệu trên Kaggle.
- Kết hợp mẫu URL an toàn (từ Alexa Top Sites) và URL phishing.

## Bước 2 – Tiền xử lý

1. Chuẩn hóa chữ thường, loại bỏ dấu `/` thừa cuối URL.
2. Loại bỏ bản ghi trùng lặp dựa trên URL chuẩn hóa.
3. Gán nhãn nhị phân (`label`): `1` cho phishing, `0` cho an toàn.

## Bước 3 – Trích xuất đặc trưng

Các đặc trưng cơ bản:

- `length`: độ dài toàn bộ URL.
- `num_digits`: số lượng chữ số.
- `num_special_chars`: số ký tự đặc biệt (`-`, `_`, `@`, `?`, `=`, `&`, `%`).
- `has_ip`: hostname là địa chỉ IP.
- `contains_login_keyword`: URL chứa từ khóa nhạy cảm (`login`, `secure`, `verify`, `password`).
- `num_subdomains`: số lượng dấu chấm trong hostname.
- `uses_https`: giá trị boolean.
- `ratio_digits`: tỷ lệ chữ số / tổng ký tự.

## Bước 4 – Lưu trữ

Sau khi xử lý, lưu dữ liệu dưới dạng CSV trong `ml/data/clean_urls.csv`. Sử dụng Pandas để đảm bảo encoding UTF-8.

## Notebook mẫu

Notebook minh họa (không kèm trong repo) gồm các bước:

```python
import pandas as pd
from urllib.parse import urlparse

from features import (
    count_digits,
    count_special_chars,
    contains_login_keyword,
    has_ip_address,
)

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["length"] = df["url"].str.len()
    df["num_digits"] = df["url"].apply(count_digits)
    df["num_special_chars"] = df["url"].apply(count_special_chars)
    df["contains_login_keyword"] = df["url"].apply(contains_login_keyword)
    df["has_ip"] = df["url"].apply(has_ip_address)
    return df
```

Kết quả cuối cùng được xuất bằng `df.to_csv("ml/data/features.csv", index=False)`.
