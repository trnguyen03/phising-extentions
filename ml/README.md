# Machine Learning Pipeline

Thư mục này chứa các script phục vụ cho việc thu thập và huấn luyện mô hình phát hiện phishing.

## Quy trình đề xuất
1. Cập nhật dữ liệu trong `ml/data/sample_urls.csv` bằng cách hợp nhất các nguồn (PhishTank, Alexa, v.v.).
2. Chạy trích xuất đặc trưng:
   ```bash
   python ml/feature_engineering.py
   ```
3. Huấn luyện mô hình logistic regression cơ bản:
   ```bash
   python ml/train_model.py
   ```
4. Kết quả huấn luyện được lưu trong `ml/model/`.
5. Cập nhật trọng số vào backend bằng cách xuất chúng ra JSON và đặt biến môi trường `MODEL_PATH` trỏ tới file đó (hoặc sao
   chép vào `backend/src/model/`).

## Phụ thuộc
- Python 3.10+
- pandas
- scikit-learn
- joblib

Sử dụng `pip install -r requirements.txt` với nội dung gợi ý:
```text
pandas
scikit-learn
joblib
```
