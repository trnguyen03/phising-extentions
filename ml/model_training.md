# Model Training & Evaluation

Tài liệu này tóm tắt quy trình huấn luyện và đánh giá mô hình phát hiện phishing.

## 1. Chuẩn bị dữ liệu

- Sử dụng tập đặc trưng từ `ml/data/features.csv`.
- Chia dữ liệu theo tỷ lệ 80/20 cho train/test.
- Chuẩn hóa các đặc trưng số bằng `StandardScaler`.

## 2. Mô hình thử nghiệm

| Model               | Accuracy | Precision | Recall | F1-Score |
| ------------------- | -------- | --------- | ------ | -------- |
| Logistic Regression | 0.93     | 0.92      | 0.91   | 0.91     |
| Random Forest       | 0.96     | 0.95      | 0.94   | 0.95     |
| XGBoost             | 0.97     | 0.96      | 0.95   | 0.96     |

Random Forest được chọn vì hiệu suất ổn định và dễ triển khai.

## 3. Lưu mô hình

```python
import joblib
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=300, max_depth=18, random_state=42)
model.fit(X_train, y_train)
joblib.dump(model, "models/phishguard_rf.pkl")
```

## 4. Tích hợp backend

1. Load mô hình trong Flask (`joblib.load`).
2. Khi nhận request, tạo vector đặc trưng tương tự pipeline huấn luyện.
3. Tính xác suất `model.predict_proba` làm `confidence`.

## 5. Báo cáo

Tạo báo cáo PDF/Markdown ngắn tóm tắt:

- Dataset sử dụng và số lượng mẫu.
- Các đặc trưng quan trọng nhất.
- Ma trận nhầm lẫn (confusion matrix).
